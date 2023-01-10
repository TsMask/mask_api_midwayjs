import { ILogger } from '@midwayjs/core';
import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
import { Inject, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { RoleDataScopeEnum } from '../enums/RoleDataScopeEnum';
import { getRealAddressByIp } from '../utils/ip2region';
import { getUaInfo } from '../utils/UAParserUtils';
import { SysLogininfor } from '../../modules/monitor/model/SysLogininfor';
import { SysUser } from '../../modules/system/model/SysUser';
import { LoginUser } from '../model/LoginUser';
import { IP_INNER_ADDR, IP_INNER_LOCATION } from '../constants/CommonConstants';

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
   * 获取用户账号
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
   * 系统访问记录
   * @param status 记录状态（0成功 1失败）
   * @param msg 记录提示消息
   * @param userName 登录账号，无身份认证时指定具体参数
   * @return 对象信息
   */
  async newSysLogininfor(
    status: string,
    msg: string,
    userName?: string
  ): Promise<SysLogininfor> {
    const logininfor = new SysLogininfor();
    logininfor.userName = userName || this.getUseName();
    const ip = this.ctx.ip;
    if (ip.includes(IP_INNER_ADDR)) {
      logininfor.ipaddr = IP_INNER_ADDR;
      logininfor.loginLocation = IP_INNER_LOCATION;
    } else {
      // 解析ip地址
      logininfor.ipaddr = ip;
      logininfor.loginLocation = await getRealAddressByIp(ip);
    }
    // 解析请求用户代理信息
    const ua = await getUaInfo(this.ctx.get('user-agent'));
    const bName = ua.getBrowser().name;
    const bVersion = ua.getBrowser().version;
    if (bName && bVersion) {
      logininfor.browser = `${bName} ${bVersion}`;
    } else {
      logininfor.browser = '未知 未知';
    }
    const oName = ua.getOS().name;
    const oVersion = ua.getOS().version;
    if (oName && oVersion) {
      logininfor.os = `${oName} ${oVersion}`;
    } else {
      logininfor.os = '未知 未知';
    }
    //
    logininfor.msg = msg;
    logininfor.status = status;
    return logininfor;
  }

  /**
   * 系统角色数据范围过滤SQL字符串
   * @param deptAlias 部门表别名
   * @param userAlias 用户表别名（可选）
   * @return SQL字符串 AND (...)
   */
  getDataScopeSQL(deptAlias: string, userAlias?: string): string {
    let dataScopeSQL = '';
    const user = this.getSysUser();
    // 如果是管理员，则不过滤数据
    if (this.isAdmin(user.userId)) return dataScopeSQL;
    // 无用户角色
    if (!user.roles || user.roles.length <= 0) return dataScopeSQL;

    // 记录角色权限范围定义添加过, 非自定数据权限不需要重复拼接SQL
    const conditions: string[] = [];
    for (const role of user.roles) {
      const dataScope = role.dataScope;

      if (RoleDataScopeEnum.ALL === dataScope) break;

      if (
        RoleDataScopeEnum.CUSTOM !== dataScope &&
        conditions.includes(dataScope)
      )
        continue;

      if (RoleDataScopeEnum.CUSTOM === dataScope) {
        dataScopeSQL += ` OR ${deptAlias}.dept_id IN ( SELECT dept_id FROM sys_role_dept WHERE role_id = ${role.roleId} ) `;
      }

      if (RoleDataScopeEnum.DEPT === dataScope) {
        dataScopeSQL += ` OR ${deptAlias}.dept_id = ${user.deptId} `;
      }

      if (RoleDataScopeEnum.DEPT_AND_CHILD === dataScope) {
        dataScopeSQL += ` OR ${deptAlias}.dept_id IN ( SELECT dept_id FROM sys_dept WHERE dept_id = ${user.deptId} or find_in_set(${user.deptId} , ancestors ) ) `;
      }

      if (RoleDataScopeEnum.SELF === dataScope) {
        if (userAlias) {
          dataScopeSQL += ` OR ${userAlias}.user_id = ${user.userId} `;
        } else {
          // 数据权限为仅本人且没有userAlias别名不查询任何数据
          dataScopeSQL += ` OR ${deptAlias}.dept_id = 0 `;
        }
      }

      // 放入记录
      conditions.push(dataScope);
    }

    return dataScopeSQL ? ` AND (${dataScopeSQL.substring(4)})` : dataScopeSQL;
  }
}
