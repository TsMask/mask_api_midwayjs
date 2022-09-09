import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 角色表 sys_role
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_role')
export class SysRole {
  /**角色ID */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'role_id',
    comment: '角色ID',
  })
  role_id: string;

  /**角色名称 */
  @Column('varchar', { name: 'role_name', comment: '角色名称', length: 30 })
  role_name: string;

  /**角色权限字符串 */
  @Column('varchar', {
    name: 'role_key',
    comment: '角色权限字符串',
    length: 100,
  })
  role_key: string;

  /**显示顺序 */
  @Column('int', { name: 'role_sort', comment: '显示顺序' })
  role_sort: number;

  /**数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限） */
  @Column('char', {
    name: 'data_scope',
    nullable: true,
    comment:
      '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）',
    length: 1,
    default: () => "'1'",
  })
  data_scope: string | null;

  /**菜单树选择项是否关联显示 */
  @Column('tinyint', {
    name: 'menu_check_strictly',
    nullable: true,
    comment: '菜单树选择项是否关联显示',
    width: 1,
    default: () => "'1'",
  })
  menu_check_strictly: boolean | null;

  /**部门树选择项是否关联显示 */
  @Column('tinyint', {
    name: 'dept_check_strictly',
    nullable: true,
    comment: '部门树选择项是否关联显示',
    width: 1,
    default: () => "'1'",
  })
  dept_check_strictly: boolean | null;

  /**角色状态（0正常 1停用） */
  @Column('char', {
    name: 'status',
    comment: '角色状态（0正常 1停用）',
    length: 1,
  })
  status: string;

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

  /**备注 */
  @Column('varchar', {
    name: 'remark',
    nullable: true,
    comment: '备注',
    length: 500,
  })
  remark: string | null;
}
