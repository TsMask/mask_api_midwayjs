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
   * @param tokenInfo 登录用户信息
   * @return 在线用户
   */
  public async tokenInfoToUserOnline(
    tokenInfo: TokenInfo
  ): Promise<SysUserOnline> {
    if (!tokenInfo || tokenInfo.userId <= 0) {
      return new SysUserOnline();
    }

    const iten = new SysUserOnline();
    iten.tokenId = tokenInfo.uuid;
    iten.userName = tokenInfo.user?.userName;
    iten.loginIp = tokenInfo.loginIp;
    iten.loginLocation = tokenInfo.loginLocation;
    iten.browser = tokenInfo.browser;
    iten.os = tokenInfo.os;
    iten.loginTime = tokenInfo.loginTime;
    if (tokenInfo.user && tokenInfo.user?.deptId > 0) {
      iten.deptName = tokenInfo.user?.dept?.deptName;
    }
    return iten;
  }
}
