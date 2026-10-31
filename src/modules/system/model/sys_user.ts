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
  deptId: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_name' })
  userName: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_nick' })
  userNick: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_email' })
  userEmail: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_phone' })
  userPhone: string;

  @Rule(Joi.string().pattern(/^[012]$/))
  @Column({ name: 'user_gender' })
  userGender: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_avatar' })
  userAvatar: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_password', select: false })
  userPassword: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'user_status' })
  userStatus: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'user_del' })
  userDel: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_login_ip' })
  userLoginIp: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'user_login_time' })
  userLoginTime: number;

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

  dept: SysDept;
  roles: SysRole[];
  roleIds: number[];
  postIds: number[];
}
