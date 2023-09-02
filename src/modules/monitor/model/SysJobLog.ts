/**
 * 定时任务调度日志表 sys_job_log
 *
 * @author TsMask
 */
export class SysJobLog {
  /**日志序号 */
  jobLogId: string;

  /**任务名称 */
  jobName: string;

  /**任务组名 */
  jobGroup: string;

  /**调用目标字符串 */
  invokeTarget: string;

  /**调用目标传入参数 */
  targetParams: string;

  /**日志信息 */
  jobMsg: string;

  /**执行状态（0失败 1正常） */
  status: string;

  /**创建时间 */
  createTime: number;

  /**消耗时间（毫秒） */
  costTime: number;
}
