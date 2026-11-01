/** 系统用户令牌信息对象 */
export class UserInfo {
  /** 会话唯一标识 */
  session_id = '';

  /** 用户设备标识 */
  device_id = '';

  /** 用户ID */
  user_id = 0;

  /** 部门ID */
  dept_id = 0;

  /** 登录IP地址 x.x.x.x */
  login_ip = '';

  /** 登录地点 xx xx */
  login_location = '';

  /** 浏览器类型 */
  login_browser = '';

  /** 操作系统 */
  login_os = '';

  /** 登录时间时间戳 */
  login_time = 0;

  /** 过期时间时间戳 */
  expire_time = 0;

  /** 权限列表 */
  permissions: string[] = [];

  /** 用户账号 */
  user_name = '';

  /** 角色key列表 */
  role_keys: string[] = [];

  /** 用户信息 */
  user: Record<string, any> = {};
}
