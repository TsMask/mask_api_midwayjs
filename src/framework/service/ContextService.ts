import { ILogger } from '@midwayjs/core';
import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
import { Inject, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { RoleDataScopeEnum } from '../enums/RoleDataScopeEnum';
import { getClientIP, getRealAddressByIp } from '../utils/ip2region';
import { getUaInfo } from '../utils/UAParserUtils';
import { SysUser } from '../../modules/system/model/SysUser';
import { LoginUser } from '../vo/LoginUser';
import { TOKEN_KEY, TOKEN_KEY_PREFIX } from '../constants/TokenConstants';

/**
 * 上下文对象服务
 *
 * 单例模式下不可用
 * @author TsMask
 */
@Provide()
export class ContextService {
  @Inject()
  private ctx: Context;

  /**
   * 获取上下文
   **/
  getContext(): Context {
    return this.ctx;
  }

  /**
   * 获取日志对象
   * 用于输出日志记录
   **/
  getLogger(): ILogger {
    return this.ctx.logger;
  }

  /**
   * 获取配置信息
   **/
  getConfig(key: string): any {
    try {
      return this.ctx.app.getConfig(key);
    } catch (e) {
      throw new Error(`获取配置信息异常, ${e.message}.`);
    }
  }

  /**
   * 获取运行服务环境
   * local prod
   **/
  getEnv(): string {
    return this.ctx.app.getEnv();
  }

  /**
   * 用户ID
   **/
  getUserId(): string {
    return this.getLoginUser().userId;
  }

  /**
   * 获取部门ID
   **/
  getDeptId(): string {
    return this.getLoginUser().deptId;
  }

  /**
   * 获取登录用户
   **/
  getLoginUser(): LoginUser {
    const loginUser = this.ctx.loginUser;
    if (loginUser) return loginUser;
    throw new UnauthorizedError('获取登录用户信息异常');
  }

  /**
   * 获取登录用户详细信息
   **/
  getSysUser(): SysUser {
    const user = this.getLoginUser().user;
    delete user.password;
    return user;
  }

  /**
   * 获取用户登录账号
   **/
  getUseName(): string {
    return this.getSysUser().userName;
  }

  /**
   * 判断用户是否为管理员
   *
   * @param userId 用户ID
   * @return 结果
   */
  isAdmin(userId: string): boolean {
    if (!userId) return false;
    // 从本地配置获取user信息
    const { adminList } = this.getConfig('user');
    return Array.isArray(adminList) && adminList.includes(userId);
  }

  /**
   * 获取请求携带的令牌
   * @returns 去除前缀字符串
   */
  async getHeaderToken(): Promise<string> {
    let headerToken = this.ctx.get(TOKEN_KEY);
    if (headerToken && headerToken.startsWith(TOKEN_KEY_PREFIX)) {
      headerToken = headerToken.replace(TOKEN_KEY_PREFIX, '');
    }
    return headerToken;
  }

  // 解析ip地址
  async ipaddrLocation(): Promise<[string, string]> {
    let ipaddr = getClientIP(this.ctx.ip);
    let location = await getRealAddressByIp(ipaddr);
    return [ipaddr, location];
  }

  // 解析请求用户代理信息
  async uaOsBrowser(): Promise<[string, string]> {
    const ua = await getUaInfo(this.ctx.get('user-agent'));
    const oName = ua.getOS().name;
    const oVersion = ua.getOS().version;
    let os = '未知 未知';
    if (oName && oVersion) {
      os = `${oName} ${oVersion}`;
    }
    const bName = ua.getBrowser().name;
    const bVersion = ua.getBrowser().version;
    let browser = '未知 未知';
    if (bName && bVersion) {
      browser = `${bName} ${bVersion}`;
    }
    return [os, browser];
  }

  /**
   * 系统角色数据范围过滤SQL字符串
   * @param deptAlias 部门表别名
   * @param userAlias 用户表别名（可选）
   * @return SQL字符串 AND (...)
   */
  getDataScopeSQL(deptAlias: string, userAlias?: string): string {
    let dataScopeSQL = '';
    // 登录用户信息
    const user = this.getSysUser();
    // 如果是管理员，则不过滤数据
    if (this.isAdmin(user.userId)) return dataScopeSQL;
    // 无用户角色
    if (!user.roles || user.roles.length <= 0) return dataScopeSQL;

    // 记录角色权限范围定义添加过, 非自定数据权限不需要重复拼接SQL
    const scopeKeys: string[] = [];
    const conditions: string[] = [];
    for (const role of user.roles) {
      const dataScope = role.dataScope;

      if (RoleDataScopeEnum.ALL === dataScope) break;

      if (
        RoleDataScopeEnum.CUSTOM !== dataScope &&
        scopeKeys.includes(dataScope)
      )
        continue;

      if (RoleDataScopeEnum.CUSTOM === dataScope) {
        conditions.push(
          `${deptAlias}.dept_id IN ( SELECT dept_id FROM sys_role_dept WHERE role_id = '${role.roleId}' )`
        );
      }

      if (RoleDataScopeEnum.DEPT === dataScope) {
        conditions.push(`${deptAlias}.dept_id = '${user.deptId}'`);
      }

      if (RoleDataScopeEnum.DEPT_AND_CHILD === dataScope) {
        conditions.push(
          `${deptAlias}.dept_id IN ( SELECT dept_id FROM sys_dept WHERE dept_id = '${user.deptId}' or find_in_set('${user.deptId}' , ancestors ) )`
        );
      }

      if (RoleDataScopeEnum.SELF === dataScope) {
        // 数据权限为仅本人且没有userAlias别名不查询任何数据
        if (userAlias) {
          conditions.push(`${userAlias}.user_id = '${user.userId}'`);
        } else {
          conditions.push(`${deptAlias}.dept_id = '0'`);
        }
      }

      // 记录角色范围
      scopeKeys.push(dataScope);
    }

    // 构建查询条件语句
    if (conditions.length > 0) {
      dataScopeSQL = ` AND ( ${conditions.join(' OR ')} ) `;
    }
    return dataScopeSQL;
  }
}
