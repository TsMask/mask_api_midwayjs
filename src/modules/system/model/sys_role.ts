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
  role_name: string;

  @Rule(Joi.string().required())
  @Column({ name: 'role_key' })
  role_key: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'role_sort' })
  role_sort: number;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_status' })
  role_status: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_del' })
  role_del: string;

  @Rule(Joi.string().pattern(/^[12345]$/))
  @Column({ name: 'role_data_scope' })
  role_data_scope: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_menu_check_strictly' })
  role_menu_check_strictly: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'role_dept_check_strictly' })
  role_dept_check_strictly: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  create_by: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  create_time: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  update_by: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  update_time: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'remark', length: 200 })
  remark: string;

  toJSON(): Record<string, unknown> {
    const json = { ...this } as Partial<SysRole>;
    delete json.role_del;
    delete json.menu_ids;
    delete json.dept_ids;
    return {
      ...json,
      ...(this.menu_ids?.length ? { menu_ids: this.menu_ids } : {}),
      ...(this.dept_ids?.length ? { dept_ids: this.dept_ids } : {}),
    };
  }

  menu_ids: number[];
  dept_ids: number[];
}
