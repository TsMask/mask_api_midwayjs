import { LoginUser } from '../../../framework/model/LoginUser';
import { SysUserOnline } from '../model/SysUserOnline';

/**
 * 在线用户 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysUserOnlineService {
  /**
   * 设置在线用户信息
   *
   * @param loginUser 用户信息
   * @return 在线用户
   */
  loginUserToUserOnline(loginUser: LoginUser): Promise<SysUserOnline>;
}
