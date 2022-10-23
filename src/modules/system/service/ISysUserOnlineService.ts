import { LoginUser } from '../../../framework/core/vo/LoginUser';
import { SysUserOnline } from '../model/SysUserOnline';

/**
 * 在线用户 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysUserOnlineService {
  /**
   * 通过登录地址查询信息
   *
   * @param ipaddr 登录地址
   * @param loginUser 用户信息
   * @return 在线用户信息
   */
  selectOnlineByIpaddr(
    ipaddr: string,
    loginUser: LoginUser
  ): Promise<SysUserOnline>;

  /**
   * 通过用户名称查询信息
   *
   * @param userName 用户名称
   * @param loginUser 用户信息
   * @return 在线用户信息
   */
  selectOnlineByUserName(
    userName: string,
    loginUser: LoginUser
  ): Promise<SysUserOnline>;

  /**
   * 通过登录地址/用户名称查询信息
   *
   * @param ipaddr 登录地址
   * @param userName 用户名称
   * @param loginUser 用户信息
   * @return 在线用户信息
   */
  selectOnlineByInfo(
    ipaddr: string,
    userName: string,
    loginUser: LoginUser
  ): Promise<SysUserOnline>;

  /**
   * 设置在线用户信息
   *
   * @param loginUser 用户信息
   * @return 在线用户
   */
  loginUserToUserOnline(loginUser: LoginUser): Promise<SysUserOnline>;
}
