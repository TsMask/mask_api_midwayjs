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
  createBy: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'title' })
  title: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_type' })
  operationType: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_url' })
  operationUrl: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_method' })
  operationMethod: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_ip' })
  operationIp: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_location' })
  operationLocation: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_param' })
  operationParam: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_function' })
  operationFunction: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'operation_cost_time' })
  operationCostTime: number;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'operation_status' })
  operationStatus: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'operation_msg' })
  operationMsg: string;
}
