import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SysDept } from './sys_dept';
import { SysRole } from './sys_role';

/** User table. */
@Entity('sys_user')
export class SysUser {
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'dept_id' })
  dept_id: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_name' })
  user_name: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_nick' })
  user_nick: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_email' })
  user_email: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_phone' })
  user_phone: string;

  @Rule(Joi.string().pattern(/^[012]$/))
  @Column({ name: 'user_gender' })
  user_gender: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_avatar' })
  user_avatar: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_password', select: false })
  user_password: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'user_status' })
  user_status: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'user_del' })
  user_del: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_login_ip' })
  user_login_ip: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'user_login_time' })
  user_login_time: number;

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
    const json = { ...this } as Partial<SysUser>;
    delete json.user_password;
    delete json.user_del;
    delete json.role_ids;
    delete json.post_ids;
    return {
      ...json,
      dept: this.dept ?? null,
      roles: this.roles ?? null,
      ...(this.role_ids?.length ? { role_ids: this.role_ids } : {}),
      ...(this.post_ids?.length ? { post_ids: this.post_ids } : {}),
    };
  }

  dept: SysDept;
  roles: SysRole[];
  role_ids: number[];
  post_ids: number[];
}
