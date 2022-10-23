/**
 * 系统访问记录表 sys_logininfor
 *
 * @author TsMask <340112800@qq.com>
 */
export class SysLogininfor {
  /**访问ID */
  infoId: string;

  /**用户账号 */
  userName: string;

  /**登录IP地址 */
  ipaddr: string;

  /**登录地点 */
  loginLocation: string;

  /**浏览器类型 */
  browser: string;

  /**操作系统 */
  os: string;

  /**登录状态（0成功 1失败） */
  status: string;

  /**提示消息 */
  msg: string;

  /**访问时间 */
  loginTime: number;
}
