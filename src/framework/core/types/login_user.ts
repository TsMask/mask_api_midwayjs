import { SysUser } from '../model/sys_user';

/**
 * 登录用户身份权限
 *
 * @author TsMask <340112800@qq.com>
 */
export type LoginUser = {
  /**用户ID */
  user_id: string;

  /**部门ID */
  dept_id: string;

  /**用户唯一标识 */
  token: string;

  /**登录时间 */
  login_time: number;

  /**过期时间 */
  expire_time: number;

  /**登录IP地址 */
  ipaddr: string;

  /**登录地点 */
  login_location: string;

  /**浏览器类型 */
  browser: string;

  /**操作系统 */
  os: string;

  /**权限列表 */
  permissions: string[];

  /**用户信息 */
  sys_user: SysUser;
};
