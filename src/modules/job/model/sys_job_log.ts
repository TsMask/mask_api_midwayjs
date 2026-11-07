import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**调度任务调度日志表 */
@Entity('sys_job_log')
export class SysJobLog {
  /**任务日志ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**创建时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  create_time: number;

  /**任务名称 */
  @Rule(Joi.string().required())
  @Column({
    type: 'varchar',
    name: 'job_name',
  })
  job_name: string;

  /**任务组名 */
  @Rule(Joi.string().required())
  @Column({ name: 'job_group' })
  job_group: string;

  /**调用目标字符串 */
  @Rule(Joi.string().required())
  @Column({ name: 'job_invoke_target' })
  job_invoke_target: string;

  /**调用目标传入参数 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'job_target_params' })
  job_target_params: string;

  /**日志信息 */
  @Rule(Joi.string().allow(''))
  @Column({ length: 2048, name: 'log_msg' })
  log_msg: string;

  /**执行状态（0失败 1正常） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'log_status' })
  log_status: string;

  /**消耗时间（毫秒） */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'log_cost_time' })
  log_cost_time: number;
}
