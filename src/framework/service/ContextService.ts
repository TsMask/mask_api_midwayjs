import { ILogger, Inject, Provide, httpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { SysUser } from '../../modules/system/model/sys_user';
import { LoginUser } from '../vo/LoginUser';
import { getUaInfo } from '../utils/UAParserUtils';
import { getClientIP, getRealAddressByIp } from '../utils/ip2region';
import { HEADER_KEY, HEADER_PREFIX } from '../constants/token';
import {
  ROLE_SCOPE_ALL,
  ROLE_SCOPE_CUSTOM,
  ROLE_SCOPE_DEPT,
  ROLE_SCOPE_DEPT_CHILD,
  ROLE_SCOPE_SELF,
} from '../constants/role_data_scope';

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
  getUserId(): number {
    return this.getLoginUser().userId;
  }

  /**
   * 获取部门ID
   **/
  getDeptId(): number {
    return this.getLoginUser().deptId;
  }

  /**
   * 获取登录用户
   **/
  getLoginUser(): LoginUser {
    const loginUser = this.ctx.loginUser;
    if (loginUser) return loginUser;
    throw new httpError.UnauthorizedError('获取登录用户信息异常');
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
  isSystemUser(userId: number): boolean {
    if (userId <= 0) return false;
    // 从配置中获取系统管理员ID列表
    const { system } = this.getConfig('user');
    return Array.isArray(system) && system.includes(userId);
  }

  /**
   * 获取请求携带的令牌
   * @returns 去除前缀字符串
   */
  async getHeaderToken(): Promise<string> {
    let headerToken = this.ctx.get(HEADER_KEY);
    if (headerToken && headerToken.startsWith(HEADER_PREFIX)) {
      headerToken = headerToken.replace(HEADER_PREFIX, '');
    }
    return headerToken;
  }

  // 解析ip地址
  async ipaddrLocation(): Promise<[string, string]> {
    const ipaddr = getClientIP(this.ctx.ip);
    const location = await getRealAddressByIp(ipaddr);
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
  getDataScopeSQL(deptAlias: string, userAlias: string): string {
    let dataScopeSQL = '';
    // 登录用户信息
    const userInfo = this.getSysUser();

    // 如果是系统管理员，则不过滤数据
    if (this.isSystemUser(userInfo.userId)) return dataScopeSQL;
    // 无用户角色
    if (!userInfo.roles || userInfo.roles.length <= 0) return dataScopeSQL;

    // 记录角色权限范围定义添加过, 非自定数据权限不需要重复拼接SQL
    const scopeKeys: string[] = [];
    const conditions: string[] = [];
    for (const role of userInfo.roles) {
      const dataScope = role.dataScope;

      if (ROLE_SCOPE_ALL === dataScope) break;

      if (ROLE_SCOPE_CUSTOM !== dataScope && scopeKeys.includes(dataScope)) {
        continue;
      }

      if (ROLE_SCOPE_CUSTOM === dataScope) {
        const sql = `${deptAlias}.dept_id IN 
        ( SELECT dept_id FROM sys_role_dept WHERE role_id = ${role.roleId} ) 
        AND ${deptAlias}.dept_id NOT IN 
        ( 
        SELECT d.parent_id FROM sys_dept d 
        INNER JOIN sys_role_dept rd ON rd.dept_id = d.dept_id 
        AND rd.role_id = ${role.roleId}
        )`;
        conditions.push(sql);
      }

      if (ROLE_SCOPE_DEPT === dataScope) {
        conditions.push(`${deptAlias}.dept_id = ${userInfo.deptId}`);
      }

      if (ROLE_SCOPE_DEPT_CHILD === dataScope) {
        const sql = `${deptAlias}.dept_id IN ( 
        SELECT dept_id FROM sys_dept 
        WHERE dept_id = ${userInfo.deptId} 
        OR find_in_set(${userInfo.deptId}, ancestors ) 
        )`;
        conditions.push(sql);
      }

      if (ROLE_SCOPE_SELF === dataScope) {
        if (userAlias === '') {
          conditions.push(`${deptAlias}.dept_id = ${userInfo.deptId}`);
        } else {
          conditions.push(`${userAlias}.user_id = ${userInfo.userId}`);
        }
      }

      // 记录角色范围
      scopeKeys.push(dataScope);
    }

    // 构建查询条件语句
    if (conditions.length > 0) {
      dataScopeSQL = ` ( ${conditions.join(' OR ')} ) `;
    }
    return dataScopeSQL;
  }
}
