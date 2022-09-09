import { SysRole } from '../../../../common/core/model/sys_role';

/**
 * 角色表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysRoleRepoInterface {
  /**
   * 根据条件分页查询角色数据
   *
   * @param sys_role 角色信息
   * @return 角色数据集合信息
   */
  select_role_list(sys_role: SysRole): Promise<SysRole[]>;

  /**
   * 根据用户ID查询角色
   *
   * @param user_id 用户ID
   * @return 角色列表
   */
  select_role_permission_by_user_id(user_id: string): Promise<SysRole[]>;

  /**
   * 查询所有角色
   *
   * @return 角色列表
   */
  select_role_all(): Promise<SysRole[]>;

  /**
   * 根据用户ID获取角色选择框列表
   *
   * @param user_id 用户ID
   * @return 选中角色ID列表
   */
  select_role_list_by_user_id(user_id: string): Promise<string[]>;

  /**
   * 通过角色ID查询角色
   *
   * @param role_id 角色ID
   * @return 角色对象信息
   */
  select_role_by_id(role_id: string): Promise<SysRole>;

  /**
   * 根据用户ID查询角色
   *
   * @param user_name 用户名
   * @return 角色列表
   */
  select_roles_by_user_name(user_name: string): Promise<SysRole[]>;

  /**
   * 校验角色名称是否唯一
   *
   * @param role_name 角色名称
   * @return 角色信息
   */
  check_unique_role_name(role_name: string): Promise<SysRole>;

  /**
   * 校验角色权限是否唯一
   *
   * @param role_key 角色权限
   * @return 角色信息
   */
  check_unique_role_key(role_key: string): Promise<SysRole>;

  /**
   * 修改角色信息
   *
   * @param sys_role 角色信息
   * @return 结果
   */
  update_role(sys_role: SysRole): Promise<number>;

  /**
   * 新增角色信息
   *
   * @param sys_role 角色信息
   * @return 结果
   */
  insert_role(sys_role: SysRole): Promise<number>;

  /**
   * 通过角色ID删除角色
   *
   * @param role_id 角色ID
   * @return 结果
   */
  delete_role_by_id(role_id: string): Promise<number>;

  /**
   * 批量删除角色信息
   *
   * @param role_ids 需要删除的角色ID
   * @return 结果
   */
  delete_role_by_ids(role_ids: string[]): Promise<number>;
}
