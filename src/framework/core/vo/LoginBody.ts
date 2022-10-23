/**
 * 用户登录对象
 *
 * @author TsMask <340112800@qq.com>
 */
export class LoginBody {
  /**用户名 */
  username: string;

  /**用户密码 */
  password: string;

  /**验证码 */
  code: string;

  /**验证码唯一标识 */
  uuid: string;
}
