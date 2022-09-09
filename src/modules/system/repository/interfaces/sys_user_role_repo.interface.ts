import { SysUserRole } from '../../model/sys_user_role';

/**
 * 用户与角色关联表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysUserRoleRepoInterface {
  /**
   * 通过用户ID删除用户和角色关联
   *
   * @param user_id 用户ID
   * @return 结果
   */
  delete_user_role_by_user_id(user_id: string): Promise<number>;

  /**
   * 批量删除用户和角色关联
   *
   * @param ids 需要删除的数据ID
   * @return 结果
   */
  delete_user_role(ids: string[]): Promise<number>;

  /**
   * 通过角色ID查询角色使用数量
   *
   * @param role_id 角色ID
   * @return 结果
   */
  count_user_role_by_role_id(role_id: string): Promise<number>;

  /**
   * 批量新增用户角色信息
   *
   * @param sys_user_role_list 用户角色列表
   * @return 结果
   */
  batch_user_role(sys_user_role_list: SysUserRole[]): Promise<number>;

  /**
   * 删除用户和角色关联信息
   *
   * @param sys_user_role 用户和角色关联信息
   * @return 结果
   */
  delete_user_role_info(sys_user_role: SysUserRole): Promise<number>;

  /**
   * 批量取消授权用户角色
   *
   * @param role_id 角色ID
   * @param user_ids 需要删除的用户数据ID
   * @return 结果
   */
  delete_user_role_infos(role_id: string, user_ids: string[]): Promise<number>;
}
