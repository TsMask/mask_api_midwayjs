import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**调度任务调度表 */
@Entity('sys_job')
export class SysJob {
  /**任务ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'job_id' })
  jobId: number;

  /**任务名称 */
  @Rule(RuleType.string().required())
  @Column({
    type: 'varchar',
    name: 'job_name',
  })
  jobName: string;

  /**任务组名 */
  @Rule(RuleType.string().required())
  @Column({ name: 'job_group' })
  jobGroup: string;

  /**调用目标字符串 */
  @Rule(RuleType.string().required())
  @Column({ name: 'invoke_target' })
  invokeTarget: string;

  /**调用目标传入参数 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'target_params' })
  targetParams: string;

  /**cron执行表达式 */
  @Rule(RuleType.string().required())
  @Column({ name: 'cron_expression' })
  cronExpression: string;

  /**计划执行错误策略（1立即执行 2执行一次 3放弃执行） */
  @Rule(RuleType.string().pattern(/^[123]$/))
  @Column({ name: 'misfire_policy' })
  misfirePolicy: string;

  /**是否并发执行（0禁止 1允许） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'concurrent' })
  concurrent: string;

  /**任务状态（0暂停 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**是否记录任务日志（0不记录 1记录） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'save_log' })
  saveLog: string;

  /**创建者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Rule(RuleType.string().allow(''))
  @Column({
    length: 200,
    name: 'remark',
  })
  remark: string;
}
