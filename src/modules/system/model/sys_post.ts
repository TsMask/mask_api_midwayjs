import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**岗位表 */
@Entity('sys_post')
export class SysPost {
  /**岗位ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**岗位编码 */
  @Rule(Joi.string().required())
  @Column({ name: 'post_code' })
  postCode: string;

  /**岗位名称 */
  @Rule(Joi.string().required())
  @Column({ name: 'post_name' })
  postName: string;

  /**显示顺序 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'post_sort' })
  postSort: number;

  /**状态（0停用 1正常） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'post_status' })
  postStatus: string;

  /**创建者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Rule(Joi.string().allow(''))
  @Column({
    length: 255,
    name: 'remark',
  })
  remark: string;
}
