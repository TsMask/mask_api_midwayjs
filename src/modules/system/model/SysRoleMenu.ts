/**
 * 角色和菜单关联 sys_role_menu
 *
 * @author TsMask
 */
export class SysRoleMenu {
  /**角色ID */
  roleId: string;

  /**菜单ID */
  menuId: string;

  constructor(roleId: string, menuId: string) {
    this.roleId = roleId;
    this.menuId = menuId;
    return this;
  }
}
