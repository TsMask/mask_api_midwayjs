/**
 * 角色表 sys_role
 *
 * @author TsMask
 */
export class SysRole {
  /**角色ID */
  roleId: string;

  /**角色名称 */
  roleName: string;

  /**角色键值 */
  roleKey: string;

  /**显示顺序 */
  roleSort: number;

  /**数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限） */
  dataScope: string;

  /**菜单树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示） */
  menuCheckStrictly: string;

  /**部门树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示）*/
  deptCheckStrictly: string;

  /**角色状态（0停用 1正常） */
  status: string;

  /**删除标志（0代表存在 1代表删除） */
  delFlag: string;

  /**创建者 */
  createBy: string;

  /**创建时间 */
  createTime: number;

  /**更新者 */
  updateBy: string;

  /**更新时间 */
  updateTime: number;

  /**备注 */
  remark: string;

  // ====== 非数据库字段属性 ======

  /**菜单组 */
  menuIds: string[];

  /**部门组（数据权限） */
  deptIds: string[];
}
