import { Entity, Index, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 字典类型表 sys_dict_type
 *
 * @author TsMask <340112800@qq.com>
 */
@Index('dict_type', ['dict_type'], { unique: true })
@Entity('sys_dict_type')
export class SysDictType {
  /**字典主键 */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'dict_id',
    comment: '字典主键',
  })
  dict_id: string;

  /**字典名称 */
  @Column('varchar', {
    name: 'dict_name',
    nullable: true,
    comment: '字典名称',
    length: 100,
  })
  dict_name: string | null;

  /**字典类型 */
  @Column('varchar', {
    name: 'dict_type',
    nullable: true,
    unique: true,
    comment: '字典类型',
    length: 100,
  })
  dict_type: string | null;

  /**状态（0正常 1停用） */
  @Column('char', {
    name: 'status',
    nullable: true,
    comment: '状态（0正常 1停用）',
    length: 1,
    default: () => "'0'",
  })
  status: string | null;

  /**创建者 */
  @Column('varchar', {
    name: 'create_by',
    nullable: true,
    comment: '创建者',
    length: 64,
  })
  create_by: string | null;

  /**创建时间 */
  @Column('datetime', {
    name: 'create_time',
    nullable: true,
    comment: '创建时间',
  })
  create_time: Date | null;

  /**更新者 */
  @Column('varchar', {
    name: 'update_by',
    nullable: true,
    comment: '更新者',
    length: 64,
  })
  update_by: string | null;

  /**更新时间 */
  @Column('datetime', {
    name: 'update_time',
    nullable: true,
    comment: '更新时间',
  })
  update_time: Date | null;

  /**备注 */
  @Column('varchar', {
    name: 'remark',
    nullable: true,
    comment: '备注',
    length: 500,
  })
  remark: string | null;
}
