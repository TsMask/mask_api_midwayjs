import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sys_dict_data')
export class SysDictData {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'dict_code',
    comment: '字典编码',
  })
  dict_code: string;

  @Column('int', {
    name: 'dict_sort',
    nullable: true,
    comment: '字典排序',
    default: () => "'0'",
  })
  dict_sort: number | null;

  @Column('varchar', {
    name: 'dict_label',
    nullable: true,
    comment: '字典标签',
    length: 100,
  })
  dict_label: string | null;

  @Column('varchar', {
    name: 'dict_value',
    nullable: true,
    comment: '字典键值',
    length: 100,
  })
  dict_value: string | null;

  @Column('varchar', {
    name: 'dict_type',
    nullable: true,
    comment: '字典类型',
    length: 100,
  })
  dict_type: string | null;

  @Column('varchar', {
    name: 'css_class',
    nullable: true,
    comment: '样式属性（其他样式扩展）',
    length: 100,
  })
  css_class: string | null;

  @Column('varchar', {
    name: 'list_class',
    nullable: true,
    comment: '表格回显样式',
    length: 100,
  })
  list_class: string | null;

  @Column('char', {
    name: 'is_default',
    nullable: true,
    comment: '是否默认（Y是 N否）',
    length: 1,
    default: () => "'N'",
  })
  is_default: string | null;

  @Column('char', {
    name: 'status',
    nullable: true,
    comment: '状态（0正常 1停用）',
    length: 1,
    default: () => "'0'",
  })
  status: string | null;

  @Column('varchar', {
    name: 'create_by',
    nullable: true,
    comment: '创建者',
    length: 64,
  })
  create_by: string | null;

  @Column('datetime', {
    name: 'create_time',
    nullable: true,
    comment: '创建时间',
  })
  create_time: Date | null;

  @Column('varchar', {
    name: 'update_by',
    nullable: true,
    comment: '更新者',
    length: 64,
  })
  update_by: string | null;

  @Column('datetime', {
    name: 'update_time',
    nullable: true,
    comment: '更新时间',
  })
  update_time: Date | null;

  @Column('varchar', {
    name: 'remark',
    nullable: true,
    comment: '备注',
    length: 500,
  })
  remark: string | null;
}
