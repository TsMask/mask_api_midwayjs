import { Rule, RuleType } from '@midwayjs/validate';

/**用户注册对象 */
export class RegisterBody {
  /**用户名 */
  @Rule(RuleType.string().required().min(4).max(26))
  username: string;

  /**用户密码 */
  @Rule(RuleType.string().required().min(6).max(26))
  password: string;

  /**用户密码确认 */
  @Rule(RuleType.string().required().min(6).max(26))
  confirmPassword: string;

  /**验证码 */
  @Rule(RuleType.string().min(1).max(6))
  code: string;

  /**验证码唯一标识 */
  @Rule(RuleType.string().min(8).max(64))
  uuid: string;
}
