import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**系统登录日志表 */
@Entity('sys_login_log')
export class SysLoginLog {
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
  @Column({ name: 'login_user_name' })
  login_user_name: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_ip' })
  login_ip: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_location' })
  login_location: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_browser' })
  login_browser: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_os' })
  login_os: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'login_status' })
  login_status: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_msg' })
  login_msg: string;
}
