import { SysUser } from '../../../framework/core/model/SysUser';

/**
 * 用户 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysUserService {
  /**
   * 根据条件分页查询用户列表
   *
   * @param query 用户信息查询信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 用户信息集合信息
   */
  selectUserPage(
    query: ListQueryPageOptions,
    dataScopeSQL?: string
  ): Promise<RowPagesType>;

  /**
   * 根据条件查询用户列表
   *
   * @param sysUser 用户信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 用户信息集合信息
   */
  selectUserList(sysUser: SysUser, dataScopeSQL?: string): Promise<SysUser[]>;

  /**
   * 根据条件分页查询分配用户角色列表
   *
   * @param roleId 角色ID
   * @param allocated 已分配的
   * @param query 用户信息查询信息
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 用户信息集合信息
   */
  selectAllocatedPage(
    roleId: string,
    allocated: boolean,
    query: ListQueryPageOptions,
    dataScopeSQL?: string
  ): Promise<RowPagesType>;

  /**
   * 通过用户名查询用户
   *
   * @param userName 用户名
   * @return 用户对象信息
   */
  selectUserByUserName(userName: string): Promise<SysUser>;

  /**
   * 通过用户ID查询用户
   *
   * @param userId 用户ID
   * @return 用户对象信息
   */
  selectUserById(userId: string): Promise<SysUser>;

  /**
   * 根据用户ID查询用户所属角色组
   *
   * @param userName 用户名
   * @return 结果
   */
  selectUserRoleGroup(userName: string): Promise<string[]>;

  /**
   * 根据用户ID查询用户所属岗位组
   *
   * @param userName 用户名
   * @return 结果
   */
  selectUserPostGroup(userName: string): Promise<string[]>;

  /**
   * 校验用户名称是否唯一
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  checkUniqueUserName(sysUser: SysUser): Promise<boolean>;

  /**
   * 校验手机号码是否唯一
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  checkUniquePhone(sysUser: SysUser): Promise<boolean>;

  /**
   * 校验email是否唯一
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  checkUniqueEmail(sysUser: SysUser): Promise<boolean>;

  /**
   * 校验用户是否允许操作
   *
   * @param sysUser 用户信息
   */
  checkUserAllowed(sysUser: SysUser): Promise<boolean>;

  /**
   * 校验用户是否有数据权限
   *
   * @param userId 用户id
   */
  checkUserDataScope(userId: string): Promise<boolean>;

  /**
   * 新增用户信息
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  insertUser(sysUser: SysUser): Promise<string>;

  /**
   * 注册用户信息
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  registerUser(sysUser: SysUser): Promise<boolean>;

  /**
   * 修改用户信息
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  updateUser(sysUser: SysUser): Promise<number>;

  /**
   * 修改用户信息同时更新角色和岗位
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  updateUserAndRolePost(sysUser: SysUser): Promise<number>;
  /**
   * 用户授权角色
   *
   * @param userId 用户ID
   * @param roleIds 角色组
   */
  insertAserAuth(userId: string, roleIds: string[]): Promise<void>;

  /**
   * 批量删除用户信息
   *
   * @param userIds 需要删除的用户ID
   * @return 结果
   */
  deleteUserByIds(userIds: string[]): Promise<number>;

  /**
   * 导入用户数据
   *
   * @param sheetItemArr 导入的用户数据列表
   * @param isUpdateSupport 是否更新支持，如果已存在，则进行更新数据
   * @param operName 操作用户
   * @return 结果
   */
  importUser(
    sheetItemArr: Record<string, string>[],
    isUpdateSupport: boolean,
    operName: string
  ): Promise<string>;
}
