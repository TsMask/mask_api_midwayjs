import { SysUserRole } from '../model/SysUserRole';

/**
 * 用户与角色关联表 数据层接口
 *
 * @author TsMask
 */
export interface ISysUserRoleRepository {
  /**
   * 通过角色ID查询角色使用数量
   *
   * @param roleId 角色ID
   * @return 结果
   */
  countUserRoleByRoleId(roleId: string): Promise<number>;

  /**
   * 批量新增用户角色信息
   *
   * @param sysUserRoles 用户角色列表
   * @return 结果
   */
  batchUserRole(sysUserRoles: SysUserRole[]): Promise<number>;

  /**
   * 批量删除用户和角色关联
   *
   * @param userIds 需要删除的用户ID
   * @return 结果
   */
  deleteUserRole(userIds: string[]): Promise<number>;

  /**
   * 批量取消授权用户角色
   *
   * @param roleId 角色ID
   * @param userIds 需要删除的用户数据ID
   * @return 结果
   */
  deleteUserRoleInfos(roleId: string, userIds: string[]): Promise<number>;
}
