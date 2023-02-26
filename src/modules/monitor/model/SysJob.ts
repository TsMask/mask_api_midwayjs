/**
 * 定时任务调度表 sys_job
 *
 * @author TsMask
 */
export class SysJob {
  /**任务ID */
  jobId: string;

  /**任务名称 */
  jobName: string;

  /**任务组名 */
  jobGroup: string;

  /**调用目标字符串 */
  invokeTarget: string;

  /**调用目标传入参数 */
  targetParams: string;

  /**cron执行表达式 */
  cronExpression: string;

  /**计划执行错误策略（1立即执行 2执行一次 3放弃执行） */
  misfirePolicy: string;

  /**是否并发执行（0禁止 1允许） */
  concurrent: string;

  /**任务状态（0暂停 1正常） */
  status: string;

  /**创建者 */
  createBy: string;

  /**创建时间 */
  createTime: number;

  /**更新者 */
  updateBy: string;

  /**更新时间 */
  updateTime: number;

  /**备注 */
  remark: string;
}
