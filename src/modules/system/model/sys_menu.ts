import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**菜单权限表 */
@Entity('sys_menu')
export class SysMenu {
  /**菜单ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'menu_id' })
  menuId: number;

  /**菜单名称 */
  @Rule(RuleType.string().required())
  @Column({ name: 'menu_name' })
  menuName: string;

  /**父菜单ID 默认0 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'parent_id' })
  parentId: number;

  /**显示顺序 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'menu_sort' })
  menuSort: number;

  /**路由地址 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'menu_path' })
  menuPath: string;

  /**组件路径 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'component' })
  component: string;

  /**是否内部跳转（0否 1是） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'frame_flag' })
  frameFlag: string;

  /**是否缓存（0不缓存 1缓存） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'cache_flag' })
  cacheFlag: string;

  /**菜单类型（D目录 M菜单 A权限） */
  @Rule(RuleType.string().pattern(/^[DMA]$/))
  @Column({ name: 'menu_type' })
  menuType: string;

  /**是否显示（0隐藏 1显示） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'visible_flag' })
  visibleFlag: string;

  /**菜单状态（0停用 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**权限标识 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'perms' })
  perms: string;

  /**菜单图标（#无图标） */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'icon' })
  icon: string;

  /**删除标记（0存在 1删除） */
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

  // ====== 非数据库字段属性 ======

  /**子菜单 */
  children: SysMenu[];
}
