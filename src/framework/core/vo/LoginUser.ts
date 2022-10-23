import { SysUser } from '../model/SysUser';

/**
 * 登录用户身份权限信息
 *
 * @author TsMask <340112800@qq.com>
 */
export class LoginUser {
  /**用户ID */
  userId: string;

  /**部门ID */
  deptId: string;

  /**用户唯一标识 */
  uuid: string;

  /**登录时间时间戳 */
  loginTime: number;

  /**过期时间时间戳 */
  expireTime: number;

  /**登录IP地址 x.x.x.x */
  ipaddr: string;

  /**登录地点 xx xx */
  loginLocation: string;

  /**浏览器类型 */
  browser: string;

  /**操作系统 */
  os: string;

  /**权限列表 */
  permissions: string[];

  /**用户信息 */
  user: SysUser;
}
