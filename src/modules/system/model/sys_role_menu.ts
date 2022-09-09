import { Entity, Column } from 'typeorm';

/**
 * 角色和菜单关联 sys_role_menu
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_role_menu')
export class SysRoleMenu {
  /**角色ID */
  @Column('bigint', { primary: true, name: 'role_id', comment: '角色ID' })
  role_id: string;

  /**菜单ID */
  @Column('bigint', { primary: true, name: 'menu_id', comment: '菜单ID' })
  menu_id: string;
}
