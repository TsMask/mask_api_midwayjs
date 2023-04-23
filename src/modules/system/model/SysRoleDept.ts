/**
 * 角色和部门关联 sys_role_dept
 *
 * @author TsMask
 */
export class SysRoleDept {
  /**角色ID */
  roleId: string;

  /**部门ID */
  deptId: string;

  constructor(roleId: string, deptId: string) {
    this.roleId = roleId;
    this.deptId = deptId;
    return this;
  }
}
