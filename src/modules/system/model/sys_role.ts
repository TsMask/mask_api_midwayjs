import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Role table. */
@Entity('sys_role')
export class SysRole {
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Rule(Joi.string().required())
  @Column({ name: 'role_name' })
  roleName: string;

  @Rule(Joi.string().required())
  @Column({ name: 'role_key' })
  roleKey: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'role_sort' })
  roleSort: number;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_status' })
  roleStatus: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_del' })
  roleDel: string;

  @Rule(Joi.string().pattern(/^[12345]$/))
  @Column({ name: 'role_data_scope' })
  roleDataScope: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_menu_check_strictly' })
  roleMenuCheckStrictly: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_dept_check_strictly' })
  roleDeptCheckStrictly: string;

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

  @Rule(Joi.string().allow(''))
  @Column({ name: 'remark', length: 200 })
  remark: string;

  menuIds: number[];
  deptIds: number[];
}
