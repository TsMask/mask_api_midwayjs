import { SysRoleDept } from '../model/SysRoleDept';

/**
 * 角色与部门关联表 数据层接口
 *
 * @author TsMask
 */
export interface ISysRoleDeptRepository {
  /**
   * 批量删除角色部门关联信息
   *
   * @param roleIds 需要删除的数据ID
   * @return 结果
   */
  deleteRoleDept(roleIds: string[]): Promise<number>;

  /**
   * 批量新增角色部门信息
   *
   * @param sysRoleDepts 角色部门列表
   * @return 结果
   */
  batchRoleDept(sysRoleDepts: SysRoleDept[]): Promise<number>;
}
