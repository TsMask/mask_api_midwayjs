import { SysDept } from '../../../../common/core/model/sys_dept';

/**
 * 部门管理 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysDeptRepoInterface {
  /**
   * 查询部门管理数据
   *
   * @param sys_dept 部门信息
   * @return 部门信息集合
   */
  select_dept_list(sys_dept: SysDept): Promise<SysDept[]>;

  /**
   * 根据角色ID查询部门树信息
   *
   * @param role_id 角色ID
   * @param dept_check_strictly 部门树选择项是否关联显示
   * @return 选中部门列表
   */
  select_dept_list_by_role_id(
    role_id: string,
    dept_check_strictly: boolean
  ): Promise<string[]>;

  /**
   * 根据部门ID查询信息
   *
   * @param dept_id 部门ID
   * @return 部门信息
   */
  selectDeptById(dept_id: string): Promise<SysDept>;

  /**
   * 根据ID查询所有子部门
   *
   * @param dept_id 部门ID
   * @return 部门列表
   */
  select_children_dept_by_id(dept_id: string): Promise<SysDept[]>;

  /**
   * 根据ID查询所有子部门（正常状态）
   *
   * @param dept_id 部门ID
   * @return 子部门数
   */
  select_normal_children_dept_by_id(dept_id: string): Promise<number>;

  /**
   * 是否存在子节点
   *
   * @param dept_id 部门ID
   * @return 结果
   */
  has_child_by_dept_id(dept_id: string): Promise<number>;

  /**
   * 查询部门是否存在用户
   *
   * @param dept_id 部门ID
   * @return 结果
   */
  check_dept_exist_user(dept_id: string): Promise<number>;

  /**
   * 校验部门名称是否唯一
   *
   * @param dept_name 部门名称
   * @param parent_id 父部门ID
   * @return 结果
   */
  check_unique_dept_name(
    dept_name: string,
    parent_id: string
  ): Promise<SysDept>;

  /**
   * 新增部门信息
   *
   * @param sys_dept 部门信息
   * @return 结果
   */
  insert_dept(sys_dept: SysDept): Promise<number>;

  /**
   * 修改部门信息
   *
   * @param sys_dept 部门信息
   * @return 结果
   */
  update_dept(sys_dept: SysDept): Promise<number>;

  /**
   * 修改所在部门正常状态
   *
   * @param dept_ids 部门ID组
   */
  update_dept_status_normal(dept_ids: string[]): Promise<boolean>;

  /**
   * 修改子元素关系
   *
   * @param sys_depts 子元素
   * @return 结果
   */
  updateDeptChildren(sys_depts: SysDept[]): Promise<SysDept>;

  /**
   * 删除部门管理信息
   *
   * @param deptId 部门ID
   * @return 结果
   */
  delete_dept_by_id(dept_id: string): Promise<SysDept>;
}
