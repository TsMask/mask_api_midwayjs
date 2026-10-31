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
  jobName: string;

  /**任务组名 */
  @Rule(Joi.string().required())
  @Column({ name: 'job_group' })
  jobGroup: string;

  /**调用目标字符串 */
  @Rule(Joi.string().required())
  @Column({ name: 'job_invoke_target' })
  jobInvokeTarget: string;

  /**调用目标传入参数 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'job_target_params' })
  jobTargetParams: string;

  /**cron执行表达式 */
  @Rule(Joi.string().required())
  @Column({ name: 'job_cron' })
  jobCron: string;

  /**计划执行错误策略（1立即执行 2执行一次 3放弃执行） */
  @Rule(Joi.string().pattern(/^[123]$/))
  @Column({ name: 'job_misfire_policy' })
  jobMisfirePolicy: string;

  /**是否并发执行（0禁止 1允许） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'job_concurrent' })
  jobConcurrent: string;

  /**任务状态（0暂停 1正常） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'job_status' })
  jobStatus: string;

  /**是否记录任务日志（0不记录 1记录） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'job_save_log' })
  jobSaveLog: string;

  /**创建者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Rule(Joi.string().allow(''))
  @Column({
    length: 200,
    name: 'remark',
  })
  remark: string;
}
