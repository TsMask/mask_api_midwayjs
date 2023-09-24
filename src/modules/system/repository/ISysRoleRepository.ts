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
   * 根据用户ID获取角色选择框列表
   *
   * @param userId 用户ID
   * @return 角色列表
   */
  selectRoleListByUserId(userId: string): Promise<SysRole[]>;

  /**
   * 通过角色ID查询角色
   *
   * @param roleId 角色ID
   * @return 角色对象信息
   */
  selectRoleByIds(roleIds: string[]): Promise<SysRole[]>;

  /**
   * 校验角色是否唯一
   *
   * @param sysRole 角色信息
   * @return 角色信息
   */
  checkUniqueRole(sysRole: SysRole): Promise<string>;

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
