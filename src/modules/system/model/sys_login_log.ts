import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**系统登录日志表 */
@Entity('sys_log_login')
export class SysLogLogin {
  /**登录ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**用户账号 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'user_name' })
  userName: string;

  /**登录IP地址 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_ip' })
  loginIp: string;

  /**登录地点 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'login_location' })
  loginLocation: string;

  /**浏览器类型 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'browser' })
  browser: string;

  /**操作系统 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'os' })
  os: string;

  /**登录状态（0失败 1成功） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**提示消息 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'msg' })
  msg: string;

  /**登录时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'login_time' })
  loginTime: number;
}
