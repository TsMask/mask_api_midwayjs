import { SysRole } from '../../../framework/core/model/SysRole';
import { SysUserRole } from '../model/SysUserRole';

/**
 * 角色 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysRoleService {
  /**
   * 根据条件分页查询角色数据
   *
   * @param query 角色信息查询信息
   * @return 角色信息集合信息
   */
  selectRolePage(query: any): Promise<rowPages>;

  /**
   * 根据条件查询角色数据
   *
   * @param sysRole 角色信息
   * @return 角色数据集合信息
   */
  selectRoleList(sysRole: SysRole): Promise<SysRole[]>;

  /**
   * 根据用户ID查询角色列表
   *
   * @param userId 用户ID
   * @return 角色列表
   */
  selectRolesByUserId(userId: string): Promise<SysRole[]>;

  /**
   * 根据用户ID查询角色权限
   *
   * @param userId 用户ID
   * @return 权限列表
   */
  selectRolePermissionByUserId(userId: string): Promise<string[]>;

  /**
   * 根据用户ID获取角色选择框列表
   *
   * @param userId 用户ID
   * @return 选中角色ID列表
   */
  selectRoleListByUserId(userId: string): Promise<string[]>;

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
   * @param sysRole 角色信息
   * @return 结果
   */
  checkUniqueRoleName(sysRole: SysRole): Promise<boolean>;

  /**
   * 校验角色权限是否唯一
   *
   * @param sysRole 角色信息
   * @return 结果
   */
  checkUniqueRoleKey(sysRole: SysRole): Promise<boolean>;

  /**
   * 校验角色是否允许操作
   *
   * @param sysRole 角色信息
   */
  checkRoleAllowed(sysRole: SysRole): Promise<boolean>;

  /**
   * 校验角色是否有数据权限
   *
   * @param roleId 角色id
   */
  checkRoleDataScope(roleId: string): Promise<boolean>;

  /**
   * 通过角色ID查询角色使用数量
   *
   * @param roleId 角色ID
   * @return 结果
   */
  countUserRoleByRoleId(roleId: string): Promise<number>;

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
   * 修改角色状态
   *
   * @param sysRole 角色信息
   * @return 结果
   */
  updateRoleStatus(sysRole: SysRole): Promise<number>;

  /**
   * 修改数据权限信息
   *
   * @param sysRole 角色信息
   * @return 结果
   */
  authDataScope(sysRole: SysRole): Promise<number>;

  /**
   * 通过角色ID删除角色
   *
   * @param roleId 角色ID
   * @return 结果
   */
  deleteRoleById(roleId: string): Promise<number>;

  /**
   * 批量删除角色信息
   *
   * @param roleIds 需要删除的角色ID
   * @return 结果
   */
  deleteRoleByIds(roleIds: string[]): Promise<number>;

  /**
   * 取消授权用户角色
   *
   * @param sysUserRole 用户和角色关联信息
   * @return 结果
   */
  deleteAuthUser(sysUserRole: SysUserRole): Promise<number>;

  /**
   * 批量取消授权用户角色
   *
   * @param roleId 角色ID
   * @param userIds 需要取消授权的用户数据ID
   * @return 结果
   */
  deleteAuthUsers(roleId: string, userIds: string[]): Promise<number>;

  /**
   * 批量选择授权用户角色
   *
   * @param roleId 角色ID
   * @param userIds 需要删除的用户数据ID
   * @return 结果
   */
  insertAuthUsers(roleId: string, userIds: string[]): Promise<number>;
}
