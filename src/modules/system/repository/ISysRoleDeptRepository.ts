import { SysRoleDept } from '../model/SysRoleDept';

/**
 * 角色与部门关联表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysRoleDeptRepository {
  /**
   * 通过角色ID删除角色和部门关联
   *
   * @param roleId 角色ID
   * @return 结果
   */
  deleteRoleDeptByRoleId(roleId: string): Promise<number>;

  /**
   * 批量删除角色部门关联信息
   *
   * @param roleIds 需要删除的数据ID
   * @return 结果
   */
  deleteRoleDeptByRoleIds(roleIds: string[]): Promise<number>;

  /**
   * 查询部门使用数量
   *
   * @param deptId 部门ID
   * @return 结果
   */
  selectCountRoleDeptByDeptId(deptId: string): Promise<number>;

  /**
   * 批量新增角色部门信息
   *
   * @param sysRoleDeptList 角色部门列表
   * @return 结果
   */
  batchRoleDept(sysRoleDeptList: SysRoleDept[]): Promise<number>;
}
