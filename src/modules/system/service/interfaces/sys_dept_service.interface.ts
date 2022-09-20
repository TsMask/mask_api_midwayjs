import { SysDept } from '../../../../framework/core/model/sys_dept';
import { TreeSelect } from '../../../../framework/core/tree_select';

/**
 * 部门管理 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysDeptServiceInterface {
  /**
   * 查询部门管理数据
   *
   * @param sys_dept 部门信息
   * @return 部门信息集合
   */
  selectDeptList(sys_dept: SysDept): Promise<SysDept[]>;

  /**
   * 查询部门树结构信息
   *
   * @param sys_dept 部门信息
   * @return 部门树信息集合
   */
  select_dept_tree_list(sys_dept: SysDept): Promise<TreeSelect[]>;

  /**
   * 构建前端所需要树结构
   *
   * @param sys_depts 部门列表
   * @return 树结构列表
   */
  build_dept_tree(sys_depts: SysDept[]): Promise<SysDept[]>;

  /**
   * 构建前端所需要下拉树结构
   *
   * @param sys_depts 部门列表
   * @return 下拉树结构列表
   */
  build_dept_tree_select(sys_depts: SysDept[]): Promise<TreeSelect[]>;

  /**
   * 根据角色ID查询部门树信息
   *
   * @param role_id 角色ID
   * @return 选中部门列表
   */
  select_dept_list_by_role_id(roleId: string): Promise<string[]>;

  /**
   * 根据部门ID查询信息
   *
   * @param dept_id 部门ID
   * @return 部门信息
   */
  select_dept_by_id(dept_id: string): Promise<SysDept>;

  /**
   * 根据ID查询所有子部门（正常状态）
   *
   * @param dept_id 部门ID
   * @return 子部门数
   */
  select_normal_children_dept_by_id(dept_id: string): Promise<number>;

  /**
   * 是否存在部门子节点
   *
   * @param dept_id 部门ID
   * @return 结果
   */
  has_child_by_dept_id(dept_id: string): Promise<boolean>;

  /**
   * 查询部门是否存在用户
   *
   * @param dept_id 部门ID
   * @return 结果 true 存在 false 不存在
   */
  check_dept_exist_user(dept_id: string): Promise<boolean>;

  /**
   * 校验部门名称是否唯一
   *
   * @param sys_dept 部门信息
   * @return 结果
   */
  check_dept_name_unique(sys_dept: SysDept): Promise<SysDept>;

  /**
   * 校验部门是否有数据权限
   *
   * @param dept_id 部门id
   */
  check_scope_dept_data(dept_id: string): Promise<boolean>;

  /**
   * 新增保存部门信息
   *
   * @param sys_dept 部门信息
   * @return 结果
   */
  insert_dept(sys_dept: SysDept): Promise<number>;

  /**
   * 修改保存部门信息
   *
   * @param sys_dept 部门信息
   * @return 结果
   */
  update_dept(sys_dept: SysDept): Promise<number>;

  /**
   * 删除部门管理信息
   *
   * @param dept_id 部门ID
   * @return 结果
   */
  delete_dept_by_id(dept_id: string): Promise<number>;
}
