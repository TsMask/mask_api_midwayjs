/**当前在线会话对象 */
export class SysUserOnline {
  /**会话编号 */
  tokenId: string;

  /**部门名称 */
  deptName: string;

  /**用户名称 */
  userName: string;

  /**登录IP地址 */
  loginIp: string;

  /**登录地址 */
  loginLocation: string;

  /**浏览器类型 */
  browser: string;

  /**操作系统 */
  os: string;

  /**登录时间 */
  loginTime: number;
}
