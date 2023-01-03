import { Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { LoginUser } from '../../../../framework/model/LoginUser';
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
  async loginUserToUserOnline(loginUser: LoginUser): Promise<SysUserOnline> {
    if (!loginUser && !loginUser.user) return null;
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
