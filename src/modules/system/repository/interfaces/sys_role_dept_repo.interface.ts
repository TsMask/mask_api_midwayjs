import { SysRoleDept } from '../../model/sys_role_dept';

/**
 * 角色与部门关联表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysRoleDeptRepoInterface {
  /**
   * 通过角色ID删除角色和部门关联
   *
   * @param role_id 角色ID
   * @return 结果
   */
  delete_role_dept_by_role_id(role_id: string): Promise<number>;

  /**
   * 批量删除角色部门关联信息
   *
   * @param role_ids 需要删除的数据ID
   * @return 结果
   */
  delete_role_dept_by_role_ids(role_ids: string[]): Promise<number>;

  /**
   * 查询部门使用数量
   *
   * @param dept_id 部门ID
   * @return 结果
   */
  select_count_role_dept_by_dept_id(dept_id: string): Promise<number>;

  /**
   * 批量新增角色部门信息
   *
   * @param sys_role_dept_list 角色部门列表
   * @return 结果
   */
  batch_role_dept(sys_role_dept_list: SysRoleDept[]): Promise<number>;
}
