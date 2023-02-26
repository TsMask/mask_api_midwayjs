import { SysRole } from '../model/SysRole';

/**
 * 角色表 数据层接口
 *
 * @author TsMask
 */
export interface ISysRoleRepository {
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
   * 根据用户ID查询角色
   *
   * @param userId 用户ID
   * @return 角色列表
   */
  selectRolePermissionByUserId(userId: string): Promise<SysRole[]>;

  /**
   * 根据用户ID获取拥有角色ID
   *
   * @param userId 用户ID
   * @return 拥有的角色ID列表
   */
  selectRoleIdsByUserId(userId: string): Promise<string[]>;

  /**
   * 通过角色ID查询角色
   *
   * @param roleId 角色ID
   * @return 角色对象信息
   */
  selectRoleById(roleId: string): Promise<SysRole>;

  /**
   * 根据用户ID查询角色
   *
   * @param userName 用户名
   * @return 角色列表
   */
  selectRolesByUserName(userName: string): Promise<SysRole[]>;

  /**
   * 校验角色名称是否唯一
   *
   * @param roleName 角色名称
   * @return 角色信息
   */
  checkUniqueRoleName(roleName: string): Promise<string>;

  /**
   * 校验角色权限是否唯一
   *
   * @param roleKey 角色权限
   * @return 角色信息
   */
  checkUniqueRoleKey(roleKey: string): Promise<string>;

  /**
   * 修改角色信息
   *
   * @param sysRole 角色信息
   * @return 结果
   */
  updateRole(sysRole: SysRole): Promise<number>;

  /**
   * 新增角色信息
   *
   * @param sysRole 角色信息
   * @return 结果
   */
  insertRole(sysRole: SysRole): Promise<string>;

  /**
   * 批量删除角色信息
   *
   * @param roleIds 需要删除的角色ID
   * @return 结果
   */
  deleteRoleByIds(roleIds: string[]): Promise<number>;
}
