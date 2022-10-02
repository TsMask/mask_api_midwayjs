import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 部门表 sys_dept
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_dept')
export class SysDept {
  /**部门id */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'dept_id',
    comment: '部门id',
  })
  dept_id: string;

  /**父部门id */
  @Column('bigint', {
    name: 'parent_id',
    nullable: true,
    comment: '父部门id',
    default: () => "'0'",
  })
  parent_id: string | null;

  /**祖级列表 */
  @Column('varchar', {
    name: 'ancestors',
    nullable: true,
    comment: '祖级列表',
    length: 50,
  })
  ancestors: string | null;

  /**部门名称 */
  @Column('varchar', {
    name: 'dept_name',
    nullable: true,
    comment: '部门名称',
    length: 30,
  })
  dept_name: string | null;

  /**显示顺序 */
  @Column('int', {
    name: 'order_num',
    nullable: true,
    comment: '显示顺序',
    default: () => "'0'",
  })
  order_num: number | null;

  /**负责人 */
  @Column('varchar', {
    name: 'leader',
    nullable: true,
    comment: '负责人',
    length: 20,
  })
  leader: string | null;

  /**联系电话 */
  @Column('varchar', {
    name: 'phone',
    nullable: true,
    comment: '联系电话',
    length: 11,
  })
  phone: string | null;

  /**邮箱 */
  @Column('varchar', {
    name: 'email',
    nullable: true,
    comment: '邮箱',
    length: 50,
  })
  email: string | null;

  /**部门状态（0正常 1停用） */
  @Column('char', {
    name: 'status',
    nullable: true,
    comment: '部门状态（0正常 1停用）',
    length: 1,
    default: () => "'0'",
  })
  status: string | null;

  /**删除标志（0代表存在 2代表删除） */
  @Column('char', {
    name: 'del_flag',
    nullable: true,
    comment: '删除标志（0代表存在 2代表删除）',
    length: 1,
    default: () => "'0'",
  })
  del_flag: string | null;

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

  // ====== 非数据库字段属性 ======

  /**子部门 */
  children: SysDept[];
}
