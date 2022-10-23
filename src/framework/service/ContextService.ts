import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
import { Inject, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { SysUser } from '../core/model/SysUser';
import { LoginUser } from '../core/vo/LoginUser';

/**
 * 上下文对象服务
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class ContextService {
  @Inject()
  private ctx: Context;

  /**
   * 获取配置信息
   **/
  getConfig(key: string): string {
    try {
      return this.ctx.app.getConfig(key);
    } catch (e) {
      throw new Error(`获取配置信息异常, ${e.message}.`);
    }
  }

  /**
   * 用户ID
   **/
  getUserId(): string {
    try {
      return this.getLoginUser().userId;
    } catch (e) {
      throw new UnauthorizedError(`获取用户ID异常, ${e.message}.`);
    }
  }

  /**
   * 获取部门ID
   **/
  getDeptId(): string {
    try {
      return this.getLoginUser().deptId;
    } catch (e) {
      throw new UnauthorizedError(`获取部门ID异常, ${e.message}.`);
    }
  }

  /**
   * 获取用户账户
   **/
  getUsername(): string {
    try {
      return this.getSysUser().userName;
    } catch (e) {
      throw new UnauthorizedError(`获取用户账户异常, ${e.message}.`);
    }
  }

  /**
   * 获取登录用户
   **/
  getLoginUser(): LoginUser {
    try {
      return this.ctx.loginUser;
    } catch (e) {
      throw new UnauthorizedError(`获取登录用户信息异常, ${e.message}.`);
    }
  }

   /**
   * 获取登录用户详细信息
   **/
    getSysUser(): SysUser {
      try {
        let user = this.ctx.loginUser.user;
        delete user.password;
        return user;
      } catch (e) {
        throw new UnauthorizedError(`获取登录用户详细信息异常, ${e.message}.`);
      }
    }

  /**
   * 是否为管理员
   *
   * @param userId 用户ID
   * @return 结果
   */
  isSuperAdmin(userId: string): boolean {
    // 从本地配置获取user信息
    const { superAdmin } = this.ctx.app.getConfig('user');
    if (Array.isArray(superAdmin) && superAdmin.includes(userId)) {
      return true;
    }
    return false;
  }
}
