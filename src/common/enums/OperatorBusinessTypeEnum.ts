/**
 * 操作日志-业务操作类型枚举
 *
 * @author TsMask <340112800@qq.com>
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

  /**生成代码 */
  GENCODE = '8',

  /**清空数据 */
  CLEAN = '9',
  
}
