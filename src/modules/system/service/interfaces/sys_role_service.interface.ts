import { SysRole } from '../../../../framework/core/model/sys_role';
import { SysUserRole } from '../../model/sys_user_role';

/**
 * 角色 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysRoleServiceInterface {
  /**
   * 根据条件分页查询角色数据
   *
   * @param sys_role 角色信息
   * @return 角色数据集合信息
   */
  select_role_list(sys_role: SysRole): Promise<SysRole[]>;

  /**
   * 根据用户ID查询角色列表
   *
   * @param user_id 用户ID
   * @return 角色列表
   */
  select_roles_by_user_id(user_id: string): Promise<SysRole[]>;

  /**
   * 根据用户ID查询角色权限
   *
   * @param user_id 用户ID
   * @return 权限列表
   */
  select_role_permission_by_user_id(user_id: string): Promise<string[]>;

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
   * 校验角色名称是否唯一
   *
   * @param sys_role 角色信息
   * @return 结果
   */
  check_unique_role_name(sys_role: SysRole): Promise<string>;

  /**
   * 校验角色权限是否唯一
   *
   * @param sys_role 角色信息
   * @return 结果
   */
  check_unique_role_key(sys_role: SysRole): Promise<string>;

  /**
   * 校验角色是否允许操作
   *
   * @param sys_role 角色信息
   */
  check_role_allowed(sys_role: SysRole): Promise<boolean>;

  /**
   * 校验角色是否有数据权限
   *
   * @param role_id 角色id
   */
  check_role_data_scope(role_id: string): Promise<boolean>;

  /**
   * 通过角色ID查询角色使用数量
   *
   * @param role_id 角色ID
   * @return 结果
   */
  count_user_role_by_role_id(role_id: string): Promise<number>;

  /**
   * 新增保存角色信息
   *
   * @param sys_role 角色信息
   * @return 结果
   */
  insert_role(sys_role: SysRole): Promise<number>;

  /**
   * 修改保存角色信息
   *
   * @param role 角色信息
   * @return 结果
   */
  update_role(sys_role: SysRole): Promise<number>;

  /**
   * 修改角色状态
   *
   * @param sys_role 角色信息
   * @return 结果
   */
  update_role_status(sys_role: SysRole): Promise<number>;

  /**
   * 修改数据权限信息
   *
   * @param role 角色信息
   * @return 结果
   */
  authDataScope(sys_role: SysRole): Promise<number>;

  /**
   * 通过角色ID删除角色
   *
   * @param role_id 角色ID
   * @return 结果
   */
  deleteRoleById(role_id: string): Promise<number>;

  /**
   * 批量删除角色信息
   *
   * @param role_ids 需要删除的角色ID
   * @return 结果
   */
  delete_role_by_ids(role_ids: string): Promise<number>;

  /**
   * 取消授权用户角色
   *
   * @param sys_user_role 用户和角色关联信息
   * @return 结果
   */
  delete_auth_user(sys_user_role: SysUserRole): Promise<number>;

  /**
   * 批量取消授权用户角色
   *
   * @param role_id 角色ID
   * @param user_ids 需要取消授权的用户数据ID
   * @return 结果
   */
  delete_auth_users(role_id: string, user_ids: string[]): Promise<number>;

  /**
   * 批量选择授权用户角色
   *
   * @param role_id 角色ID
   * @param user_ids 需要删除的用户数据ID
   * @return 结果
   */
  insert_auth_users(role_id: string, user_ids: string[]): Promise<number>;
}
