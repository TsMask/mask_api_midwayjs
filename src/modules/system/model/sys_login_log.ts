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
  createBy: string;

  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_user_name' })
  loginUserName: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_ip' })
  loginIp: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_location' })
  loginLocation: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_browser' })
  loginBrowser: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_os' })
  loginOs: string;

  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'login_status' })
  loginStatus: string;

  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_msg' })
  loginMsg: string;
}
