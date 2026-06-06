import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**调度任务调度日志表 */
@Entity('sys_job_log')
export class SysJobLog {
  /**任务日志ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'log_id' })
  logId: number;

  /**任务名称 */
  @Rule(Joi.string().required())
  @Column({
    type: 'varchar',
    name: 'job_name',
  })
  jobName: string;

  /**任务组名 */
  @Rule(Joi.string().required())
  @Column({ name: 'job_group' })
  jobGroup: string;

  /**调用目标字符串 */
  @Rule(Joi.string().required())
  @Column({ name: 'invoke_target' })
  invokeTarget: string;

  /**调用目标传入参数 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'target_params' })
  targetParams: string;

  /**日志信息 */
  @Rule(Joi.string().allow(''))
  @Column({
    length: 500,
    name: 'job_msg',
  })
  jobMsg: string;

  /**执行状态（0失败 1正常） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**创建时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  /**消耗时间（毫秒） */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'cost_time' })
  costTime: number;
}
