/**
 * 定时任务调度日志表 sys_job_log
 *
 * @author TsMask <340112800@qq.com>
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

  /**日志信息 */
  jobMessage: string;

  /**异常信息 */
  exceptionInfo: string;

  /**执行状态（0正常 1失败） */
  status: string;

  /**创建时间 */
  createTime: number;
}
