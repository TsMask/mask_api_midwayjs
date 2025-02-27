import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**字典数据表 */
@Entity('sys_dict_data')
export class SysDictData {
  /**数据ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'data_id' })
  dataId: number;

  /**字典类型 */
  @Rule(RuleType.string().required())
  @Column({ name: 'dict_type' })
  dictType: string;

  /**数据标签 */
  @Rule(RuleType.string().required())
  @Column({ name: 'data_label' })
  dataLabel: string;

  /**数据键值 */
  @Rule(RuleType.string().required())
  @Column({ name: 'data_value' })
  dataValue: string;

  /**数据排序 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'data_sort' })
  dataSort: number;

  /**样式属性（样式扩展） */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'tag_class' })
  tagClass: string;

  /**标签类型（预设颜色） */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'tag_type' })
  tagType: string;

  /**状态（0停用 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**删除标志（0代表存在 1代表删除） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'del_flag' })
  delFlag: string;

  /**创建者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Rule(RuleType.string().allow(''))
  @Column({
    length: 200,
    name: 'remark',
  })
  remark: string;
}
