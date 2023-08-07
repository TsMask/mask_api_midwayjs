import { SysRole } from '../model/SysRole';

/**
 * 角色 服务层接口
 *
 * @author TsMask
 */
export interface ISysRoleService {
  /**
   * 根据条件分页查询角色数据
   *
   * @param query 角色信息查询信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 角色信息集合信息
   */
  selectRolePage(
    query: ListQueryPageOptions,
    dataScopeSQL?: string
  ): Promise<RowPagesType>;

  /**
   * 根据条件查询角色数据
   *
   * @param sysRole 角色信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 角色数据集合信息
   */
  selectRoleList(sysRole: SysRole, dataScopeSQL?: string): Promise<SysRole[]>;

  /**
   * 根据用户ID获取角色选择框列表
   *
   * @param userId 用户ID
   * @return 角色列表
   */
  selectRoleListByUserId(userId: string): Promise<SysRole[]> 

  /**
   * 通过角色ID查询角色
   *
   * @param roleId 角色ID
   * @return 角色对象信息
   */
  selectRoleById(roleId: string): Promise<SysRole>;

  /**
   * 校验角色名称是否唯一
   *
   * @param roleName 角色名称
   * @param roleId 角色ID，更新时传入
   * @return 结果
   */
  checkUniqueRoleName(roleName: string, roleId: string): Promise<boolean>;

  /**
   * 校验角色权限是否唯一
   *
   * @param roleKey 角色Key
   * @param roleId 角色ID，更新时传入
   * @return 结果
   */
  checkUniqueRoleKey(roleKey: string, roleId: string): Promise<boolean>;

  /**
   * 新增保存角色信息
   *
   * @param sysRole 角色信息
   * @return 返回记录ID
   */
  insertRole(sysRole: SysRole): Promise<string>;

  /**
   * 修改保存角色信息
   *
   * @param role 角色信息
   * @return 结果
   */
  updateRole(sysRole: SysRole): Promise<number>;

  /**
   * 修改数据权限信息
   *
   * @param sysRole 角色信息
   * @return 结果
   */
  authDataScope(sysRole: SysRole): Promise<number>;

  /**
   * 批量删除角色信息
   *
   * @param roleIds 需要删除的角色ID
   * @return 结果
   */
  deleteRoleByIds(roleIds: string[]): Promise<number>;

  /**
   * 批量取消授权用户角色
   *
   * @param roleId 角色ID
   * @param userIds 需要取消授权的用户数据ID
   * @return 结果
   */
  deleteAuthUsers(roleId: string, userIds: string[]): Promise<number>;

  /**
   * 批量新增授权用户角色
   *
   * @param roleId 角色ID
   * @param userIds 需要删除的用户数据ID
   * @return 结果
   */
  insertAuthUsers(roleId: string, userIds: string[]): Promise<number>;
}
