/**
 * 操作日志-操作人类别枚举
 *
 * @author TsMask <340112800@qq.com>
 */
export enum OperatorTypeEnum {
  /**其它 */
  OTHER = '0',

  /**后台用户 */
  MANAGE = '1',

  /**手机端用户 */
  MOBILE = '2',
}

/**操作日志-操作人类别 */
export const OPERATOR_TYPE: Record<string, string> = {
  '0': '其它',
  '1': '后台用户',
  '2': '手机端用户',
};
