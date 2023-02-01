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

  /**
   * 实例new函数
   * @param jobName 任务名称
   * @param jobGroup 任务组名
   * @param invokeTarget 调用目标传入参数
   * @param targetParams 调用目标传入参数
   * @param status 执行状态（0失败 1正常）
   * @param msg 结果信息
   * @returns SysJobLog
   */
  public new(
    jobName: string,
    jobGroup: string,
    invokeTarget: string,
    targetParams: string,
    status: string,
    msg: string
  ) {
    this.jobName = jobName;
    this.jobGroup = jobGroup;
    this.invokeTarget = invokeTarget;
    this.targetParams = targetParams;
    this.status = status;
    this.jobMsg = msg;
    return this;
  }
}