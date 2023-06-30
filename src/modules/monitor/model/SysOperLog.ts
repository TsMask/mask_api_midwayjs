/**
 * 操作日志记录表 sys_oper_log
 *
 * @author TsMask
 */
export class SysOperLog {
  /**日志主键 */
  operId: string;

  /**模块标题 */
  title: string;

  /**业务类型（0其它 1新增 2修改 3删除 4授权 5导出 6导入 7强退 8清空数据） */
  businessType: string;

  /**方法名称 */
  method: string;

  /**请求方式 */
  requestMethod: string;

  /**操作类别（0其它 1后台用户 2手机端用户） */
  operatorType: string;

  /**操作人员 */
  operName: string;

  /**部门名称 */
  deptName: string;

  /**请求URL */
  operUrl: string;

  /**主机地址 */
  operIp: string;

  /**操作地点 */
  operLocation: string;

  /**请求参数 */
  operParam: string;

  /**操作消息 */
  operMsg: string;

  /**操作状态（0异常 1正常） */
  status: string;

  /**操作时间 */
  operTime: number;

  /**消耗时间（毫秒） */
  costTime: number;
}
