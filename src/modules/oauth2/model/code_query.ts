import { Rule, RuleType } from '@midwayjs/validate';

/**重定向授权码参数 */
export class CodeQuery {
  /**授权回调地址 */
  @Rule(RuleType.string().required())
  redirectUrl: string;

  /**申请得到的客户端ID */
  @Rule(RuleType.string().required())
  clientId: string;

  /**随机字符串，认证服务器会原封不动地返回这个值 */
  @Rule(RuleType.string().required())
  state: string;
}
