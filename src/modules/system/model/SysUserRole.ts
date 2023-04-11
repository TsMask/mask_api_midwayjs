/**
 * 用户和角色关联 sys_user_role
 *
 * @author TsMask
 */
export class SysUserRole {
  /**用户ID */
  userId: string;

  /**角色ID */
  roleId: string;

  constructor(userId: string, roleId: string) {
    this.userId = userId;
    this.roleId = roleId;
    return this;
  }
}
