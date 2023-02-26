/**
 * 操作日志-业务操作类型枚举
 *
 * @author TsMask
 */
export enum OperatorBusinessTypeEnum {
  /**其它 */
  OTHER = '0',

  /**新增 */
  INSERT = '1',

  /**修改 */
  UPDATE = '2',

  /**删除 */
  DELETE = '3',

  /**授权 */
  GRANT = '4',

  /**导出 */
  EXPORT = '5',

  /**导入 */
  IMPORT = '6',

  /**强退 */
  FORCE = '7',

  /**清空数据 */
  CLEAN = '8',
}

/**操作日志-业务操作类型 */
export const OPERATOR_BUSINESS_TYPE: Record<string, string> = {
  '0': '其它',
  '1': '新增',
  '2': '修改',
  '3': '删除',
  '4': '授权',
  '5': '导出',
  '6': '导入',
  '7': '强退',
  '8': '清空数据',
};
