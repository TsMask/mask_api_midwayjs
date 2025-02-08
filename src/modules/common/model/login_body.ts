import { Rule, RuleType } from '@midwayjs/validate';

/**用户登录对象 */
export class LoginBody {
  /**用户名 */
  @Rule(RuleType.string().required().min(4).max(26))
  username: string;

  /**用户密码 */
  @Rule(RuleType.string().required().min(6).max(26))
  password: string;

  /**验证码 */
  @Rule(RuleType.string().min(1).max(6))
  code: string;

  /**验证码唯一标识 */
  @Rule(RuleType.string().min(8).max(64))
  uuid: string;
}
