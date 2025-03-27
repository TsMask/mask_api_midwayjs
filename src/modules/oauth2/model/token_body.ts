import { Rule, RuleType } from '@midwayjs/validate';

/**获取访问令牌参数 */
export class TokenBody {
  /**申请应用时获得的client_id */
  @Rule(RuleType.string().required())
  clientId: string;

  /**申请应用时分配的secret */
  @Rule(RuleType.string().required())
  clientSecret: string;

  /**请求的类型，此处的值固定为 authorization_code/refresh_token */
  @Rule(RuleType.string().required())
  grantType: string;

  /**授权拿到的code值 */
  @Rule(RuleType.string().allow(''))
  code: string;

  /**刷新令牌 */
  @Rule(RuleType.string().allow(''))
  refreshToken: string;
}
