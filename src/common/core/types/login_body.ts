/**
 * 用户登录对象
 *
 * @author TsMask <340112800@qq.com>
 */
export type LoginBody = {
  /**用户名 */
  username: string;

  /**用户密码 */
  password: string;

  /**验证码 */
  code: string;

  /**唯一标识 */
  uuid: string;
};
