import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**参数配置表 */
@Entity('sys_config')
export class SysConfig {
  /**参数ID */
  @Rule(Joi.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**参数名称 */
  @Rule(Joi.string().required())
  @Column({ name: 'config_name' })
  configName: string;

  /**参数键名 */
  @Rule(Joi.string().required())
  @Column({ name: 'config_key' })
  configKey: string;

  /**参数键值 */
  @Rule(Joi.string().required())
  @Column({ name: 'config_value' })
  configValue: string;

  /**参数键值类型（string/number/boolean/json） */
  @Rule(Joi.string().valid('string', 'number', 'boolean', 'json').allow(''))
  @Column({ length: 128, name: 'config_value_type' })
  configValueType: string;

  /**参数分组 */
  @Rule(Joi.string().allow(''))
  @Column({ name: 'config_group' })
  configGroup: string;

  /**排序 */
  @Rule(Joi.number().allow(0))
  @Column({ name: 'config_sort' })
  configSort: number;

  /**状态（0停用 1正常） */
  @Rule(Joi.string().pattern(/^[01]$/))
  @Column({ name: 'config_status' })
  configStatus: string;

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
    length: 200,
    name: 'remark',
  })
  remark: string;
}
