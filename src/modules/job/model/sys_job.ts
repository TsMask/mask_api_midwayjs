import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**调度任务调度表 */
@Entity('sys_job')
export class SysJob {
  /**任务ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

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

  /**cron执行表达式 */
  @Rule(Joi.string().required())
  @Column({ name: 'job_cron' })
  job_cron: string;

  /**计划执行错误策略（1立即执行 2执行一次 3放弃执行） */
  @Rule(Joi.string().pattern(/^[123]$/))
  @Column({ name: 'job_misfire_policy' })
  job_misfire_policy: string;

  /**是否并发执行（0禁止 1允许） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'job_concurrent' })
  job_concurrent: string;

  /**任务状态（0暂停 1正常） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'job_status' })
  job_status: string;

  /**是否记录任务日志（0不记录 1记录） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'job_save_log' })
  job_save_log: string;

  /**创建者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  create_by: string;

  /**创建时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  create_time: number;

  /**更新者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  update_by: string;

  /**更新时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  update_time: number;

  /**备注 */
  @Rule(Joi.string().allow(''))
  @Column({
    length: 200,
    name: 'remark',
  })
  remark: string;
}
