import { LoginUser } from '../../../../common/core/types/login_user';
import { SysUserOnline } from '../../model/sys_user_online';

/**
 * 在线用户 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysUserOnlineServiceInterface {
  /**
   * 通过登录地址查询信息
   *
   * @param ipaddr 登录地址
   * @param login_user 用户信息
   * @return 在线用户信息
   */
  select_online_by_ipaddr(
    ipaddr: string,
    login_user: LoginUser
  ): Promise<SysUserOnline>;

  /**
   * 通过用户名称查询信息
   *
   * @param user_name 用户名称
   * @param login_user 用户信息
   * @return 在线用户信息
   */
  select_online_by_user_name(
    user_name: string,
    login_user: LoginUser
  ): Promise<SysUserOnline>;

  /**
   * 通过登录地址/用户名称查询信息
   *
   * @param ipaddr 登录地址
   * @param user_name 用户名称
   * @param login_user 用户信息
   * @return 在线用户信息
   */
  select_online_by_info(
    ipaddr: string,
    user_name: string,
    login_user: LoginUser
  ): Promise<SysUserOnline>;

  /**
   * 设置在线用户信息
   *
   * @param login_user 用户信息
   * @return 在线用户
   */
  login_user_to_user_online(login_user: LoginUser): Promise<SysUserOnline>;
}
