import { Provide, Singleton } from '@midwayjs/core';
import { UserInfo } from '../../../framework/token/user_info';
import { SysUserOnline } from '../model/sys_user_online';

/**在线用户 服务层处理 */
@Provide()
@Singleton()
export class SysUserOnlineService {
  /**
   * 在线用户信息
   *
   * @param info 登录用户信息
   * @return 在线用户
   */
  public async userInfoToUserOnline(info: UserInfo): Promise<SysUserOnline> {
    if (info.userId <= 0) {
      return new SysUserOnline();
    }

    const iten = new SysUserOnline();
    iten.tokenId = info.deviceId;
    iten.userName = info.user?.userName;
    iten.loginIp = info.loginIp;
    iten.loginLocation = info.loginLocation;
    iten.browser = info.browser;
    iten.os = info.os;
    iten.loginTime = info.loginTime;
    if (info.user && info.user?.deptId > 0) {
      iten.deptName = info.user?.dept?.deptName;
    }
    return iten;
  }
}
