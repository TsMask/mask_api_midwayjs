import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 定时任务调度日志表 sys_job_log
 *
 * @author TsMask
 */
@Entity('sys_job_log')
export class SysJobLog {
  /**日志序号 */
  @PrimaryGeneratedColumn({ name: 'job_log_id' })
  jobLogId: string;

  /**任务名称 */
  @Column({ name: 'job_name' })
  jobName: string;

  /**任务组名 */
  @Column({ name: 'job_group' })
  jobGroup: string;

  /**调用目标字符串 */
  @Column({ name: 'invoke_target' })
  invokeTarget: string;

  /**调用目标传入参数 */
  @Column({
    length: 300,
    name: 'target_params',
  })
  targetParams: string;

  /**日志信息 */
  @Column({ name: 'job_msg' })
  jobMsg: string;

  /**执行状态（0失败 1正常） */
  @Column({ name: 'status' })
  status: string;

  /**创建时间 */
  @Column({ name: 'create_time' })
  createTime: number;
}
