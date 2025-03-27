/**第三方客户端令牌信息对象 */
export class Oauth2Info {
  /**用户设备标识 */
  deviceId: string;

  /**客户端ID */
  clientId: string;

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
  scope: string[];
}
