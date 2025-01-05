import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**字典类型表 */
@Entity('sys_dict_type')
export class SysDictType {
  /**字典ID */
  @Rule(RuleType.number())
  @PrimaryGeneratedColumn('rowid', { name: 'dict_id' })
  dictId: number;

  /**字典名称 */
  @Rule(RuleType.string().required())
  @Column({ name: 'dict_name' })
  dictName: string;

  /**字典类型 */
  @Rule(RuleType.string().required())
  @Column({ name: 'dict_type' })
  dictType: string;

  /**状态（0停用 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**删除标记（0存在 1删除） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'del_flag' })
  delFlag: string;

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
