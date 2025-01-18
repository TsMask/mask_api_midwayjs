import { SysUser } from '../../../modules/system/model/sys_user';

/**令牌信息对象 */
export class TokenInfo {
  /**用户唯一标识 */
  uuid: string;

  /**用户ID */
  userId: number;

  /**部门ID */
  deptId: number;

  /**登录时间时间戳 */
  loginTime: number;

  /**过期时间时间戳 */
  expireTime: number;

  /**登录IP地址 x.x.x.x */
  loginIp: string;

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
