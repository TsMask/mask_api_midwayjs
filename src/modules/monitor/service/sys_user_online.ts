import { Provide, Singleton } from '@midwayjs/core';
import { TokenInfo } from '../../../framework/utils/token/token_info';
import { SysUserOnline } from '../model/sys_user_online';

/**在线用户 服务层处理 */
@Provide()
@Singleton()
export class SysUserOnlineService {
  /**
   * 设置在线用户信息
   *
   * @param loginUser 用户信息
   * @return 在线用户
   */
  public async loginUserToUserOnline(
    loginUser: TokenInfo
  ): Promise<SysUserOnline> {
    if (!loginUser || loginUser.userId <= 0) {
      return new SysUserOnline();
    }

    const iten = new SysUserOnline();
    iten.tokenId = loginUser.uuid;
    iten.userName = loginUser.user?.userName;
    iten.loginIp = loginUser.loginIp;
    iten.loginLocation = loginUser.loginLocation;
    iten.browser = loginUser.browser;
    iten.os = loginUser.os;
    iten.loginTime = loginUser.loginTime;
    if (loginUser.user && loginUser.user?.deptId > 0) {
      iten.deptName = loginUser.user?.dept?.deptName;
    }
    return iten;
  }
}
