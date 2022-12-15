import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { LoginUser } from '../../../../framework/core/vo/LoginUser';
import { SysUserOnline } from '../../model/SysUserOnline';
import { ISysUserOnlineService } from '../ISysUserOnlineService';

/**
 * 在线用户 服务层实现
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysUserOnlineServiceImpl implements ISysUserOnlineService {
  async selectOnlineByIpaddr(
    ipaddr: string,
    loginUser: LoginUser
  ): Promise<SysUserOnline> {
    if (ipaddr === loginUser.ipaddr) {
      return await this.loginUserToUserOnline(loginUser);
    }
    return null;
  }

  async selectOnlineByUserName(
    userName: string,
    loginUser: LoginUser
  ): Promise<SysUserOnline> {
    if (userName === loginUser.user?.userName) {
      return await this.loginUserToUserOnline(loginUser);
    }
    return null;
  }

  async selectOnlineByInfo(
    ipaddr: string,
    userName: string,
    loginUser: LoginUser
  ): Promise<SysUserOnline> {
    if (ipaddr === loginUser.ipaddr && userName === loginUser.user?.userName) {
      return await this.loginUserToUserOnline(loginUser);
    }
    return null;
  }

  async loginUserToUserOnline(loginUser: LoginUser): Promise<SysUserOnline> {
    if (!loginUser && !loginUser.user) {
      return null;
    }
    const sysUserOnline = new SysUserOnline();
    sysUserOnline.tokenId = loginUser.uuid;
    sysUserOnline.userName = loginUser.user?.userName;
    sysUserOnline.ipaddr = loginUser.ipaddr;
    sysUserOnline.loginLocation = loginUser.loginLocation;
    sysUserOnline.browser = loginUser.browser;
    sysUserOnline.os = loginUser.os;
    sysUserOnline.loginTime = loginUser.loginTime;
    if (loginUser.user && loginUser.user?.dept) {
      sysUserOnline.deptName = loginUser.user?.dept?.deptName;
    }
    return sysUserOnline;
  }
}
