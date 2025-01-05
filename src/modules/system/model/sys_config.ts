import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**参数配置表 */
@Entity('sys_config')
export class SysConfig {
  /**参数主键 */
  @Rule(RuleType.number())
  @PrimaryGeneratedColumn('rowid', { name: 'config_id' })
  configId: number;

  /**参数名称 */
  @Rule(RuleType.string().required())
  @Column({ name: 'config_name' })
  configName: string;

  /**参数键名 */
  @Rule(RuleType.string().required())
  @Column({ name: 'config_key' })
  configKey: string;

  /**参数键值 */
  @Rule(RuleType.string().required())
  @Column({ name: 'config_value' })
  configValue: string;

  /**系统内置（Y是 N否） */
  @Rule(RuleType.string().pattern(/^[YN]$/))
  @Column({ name: 'config_type' })
  configType: string;

  /**创建者 */
  @Rule(RuleType.string())
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Rule(RuleType.number())
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Rule(RuleType.string())
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Rule(RuleType.number())
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Rule(RuleType.string())
  @Column({
    length: 200,
    name: 'remark',
  })
  remark: string;
}
