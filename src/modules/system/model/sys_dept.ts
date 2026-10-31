import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Department table; parentage is derived from sys_dept_closure. */
@Entity('sys_dept')
export class SysDept {
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /** Derived from a closure relation with depth = 1. */
  @Rule(Joi.number().allow(0))
  parentId: number;

  @Rule(Joi.string().required())
  @Column({ name: 'dept_name' })
  deptName: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'dept_leader' })
  deptLeader: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'dept_phone' })
  deptPhone: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'dept_email' })
  deptEmail: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'dept_sort' })
  deptSort: number;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'dept_status' })
  deptStatus: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'remark' })
  remark: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  children: SysDept[];
}
