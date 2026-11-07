import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**通知公告表 */
@Entity('sys_notice')
export class SysNotice {
  /**公告ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**公告标题 */
  @Rule(Joi.string().required())
  @Column({ name: 'notice_title' })
  notice_title: string;

  /**公告类型（1通知 2公告） */
  @Rule(Joi.string().required())
  @Column({ name: 'notice_type' })
  notice_type: string;

  /**公告内容 */
  @Rule(Joi.string().required())
  @Column({ name: 'notice_content' })
  notice_content: string;

  /**公告状态（0关闭 1正常 2审核 3已删除） */
  @Rule(Joi.string().pattern(/^[0123]$/))
  @Column({ name: 'notice_status' })
  notice_status: string;

  /**创建者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  create_by: string;

  /**创建时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  create_time: number;

  /**更新者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  update_by: string;

  /**更新时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  update_time: number;

  /**备注 */
  @Rule(Joi.string().allow(''))
  @Column({
    length: 255,
    name: 'remark',
  })
  remark: string;

  toJSON(): Record<string, unknown> {
    const json = { ...this } as Partial<SysNotice>;
    return json;
  }
}
