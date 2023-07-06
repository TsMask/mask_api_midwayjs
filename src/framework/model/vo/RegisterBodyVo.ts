/**
 * 用户注册对象
 *
 * @author TsMask
 */
export class RegisterBodyVo {
  /**用户名 */
  username: string;

  /**用户密码 */
  password: string;

  /**用户确认密码 */
  confirmPassword: string;

  /**验证码 */
  code: string;

  /**验证码唯一标识 */
  uuid: string;

  /**标记用户类型 */
  userType: string;
}
