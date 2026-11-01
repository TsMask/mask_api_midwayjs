import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 测试ORM表 demo_orm
 *
 * 必须要model目录下实体文件名称才能匹配使用typeorm实体扫描
 */
@Entity('demo_orm')
export class DemoORM {
  /**测试ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

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
  @Column({ length: 200, name: 'remark' })
  remark: string;

  /**测试标题 */
  @Rule(Joi.string().required())
  @Column({
    type: 'varchar',
    name: 'title',
  })
  title: string;

  /**orm类型 */
  @Rule(Joi.string().required())
  @Column({ name: 'orm_type' })
  ormType: string;

  /**状态（0关闭 1正常） */
  @Rule(
    Joi.string()
      .required()
      .pattern(/^[01]$/)
  )
  @Column({ name: 'orm_status' })
  ormStatus: string;
}
