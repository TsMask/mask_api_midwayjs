import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * 菜单权限表 sys_menu
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_menu')
export class SysMenu {
  /**菜单ID */
  @PrimaryGeneratedColumn({
    type: 'bigint',
    name: 'menu_id',
    comment: '菜单ID',
  })
  menu_id: string;

  /**菜单名称 */
  @Column('varchar', { name: 'menu_name', comment: '菜单名称', length: 50 })
  menu_name: string;

  /**父菜单ID */
  @Column('bigint', {
    name: 'parent_id',
    nullable: true,
    comment: '父菜单ID',
    default: () => "'0'",
  })
  parent_id: string | null;

  /**显示顺序 */
  @Column('int', {
    name: 'order_num',
    nullable: true,
    comment: '显示顺序',
    default: () => "'0'",
  })
  order_num: number | null;

  /**路由地址 */
  @Column('varchar', {
    name: 'path',
    nullable: true,
    comment: '路由地址',
    length: 200,
  })
  path: string | null;

  /**组件路径 */
  @Column('varchar', {
    name: 'component',
    nullable: true,
    comment: '组件路径',
    length: 255,
  })
  component: string | null;

  /**路由参数 */
  @Column('varchar', {
    name: 'query',
    nullable: true,
    comment: '路由参数',
    length: 255,
  })
  query: string | null;

  /**是否为外链（0是 1否） */
  @Column('int', {
    name: 'is_frame',
    nullable: true,
    comment: '是否为外链（0是 1否）',
    default: () => "'1'",
  })
  is_frame: number | null;

  /**是否缓存（0缓存 1不缓存） */
  @Column('int', {
    name: 'is_cache',
    nullable: true,
    comment: '是否缓存（0缓存 1不缓存）',
    default: () => "'0'",
  })
  is_cache: number | null;

  /**菜单类型（M目录 C菜单 F按钮） */
  @Column('char', {
    name: 'menu_type',
    nullable: true,
    comment: '菜单类型（M目录 C菜单 F按钮）',
    length: 1,
  })
  menu_type: string | null;

  /**菜单状态（0显示 1隐藏） */
  @Column('char', {
    name: 'visible',
    nullable: true,
    comment: '菜单状态（0显示 1隐藏）',
    length: 1,
    default: () => "'0'",
  })
  visible: string | null;

  /**菜单状态（0正常 1停用） */
  @Column('char', {
    name: 'status',
    nullable: true,
    comment: '菜单状态（0正常 1停用）',
    length: 1,
    default: () => "'0'",
  })
  status: string | null;

  /**权限标识 */
  @Column('varchar', {
    name: 'perms',
    nullable: true,
    comment: '权限标识',
    length: 100,
  })
  perms: string | null;

  /**菜单图标 */
  @Column('varchar', {
    name: 'icon',
    nullable: true,
    comment: '菜单图标',
    length: 100,
    default: () => "'#'",
  })
  icon: string | null;

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

  // ====== 非数据库字段属性 ======

  /**子菜单 */
  children: SysMenu[];
}
