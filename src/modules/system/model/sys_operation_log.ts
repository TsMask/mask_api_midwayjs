import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**系统操作日志表 */
@Entity('sys_operation_log')
export class SysOperationLog {
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  create_by: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  create_time: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'title' })
  title: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_type' })
  operation_type: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_url' })
  operation_url: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_method' })
  operation_method: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_ip' })
  operation_ip: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_location' })
  operation_location: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_param' })
  operation_param: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_function' })
  operation_function: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'operation_cost_time' })
  operation_cost_time: number;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'operation_status' })
  operation_status: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_msg' })
  operation_msg: string;
}
