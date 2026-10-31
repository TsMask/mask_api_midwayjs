/**业务层写入会话 user 字段时的通用对象类型 */
export type AnyRecord = Record<string, any>;

/**系统用户令牌信息对象 */
export class UserInfo {
  /**会话唯一标识 */
  sessionId = '';

  /**用户设备标识 */
  deviceId = '';

  /**用户ID */
  userId = 0;

  /**部门ID */
  deptId = 0;

  /**登录时间时间戳 */
  loginTime = 0;

  /**过期时间时间戳 */
  expireTime = 0;

  /**登录IP地址 x.x.x.x */
  loginIp = '';

  /**登录地点 xx xx */
  loginLocation = '';

  /**浏览器类型 */
  browser = '';

  /**操作系统 */
  os = '';

  /**权限列表 */
  permissions: string[] = [];

  /**用户信息 */
  user: Record<string, any> = {};
}
