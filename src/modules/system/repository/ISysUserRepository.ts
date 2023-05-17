import { SysUser } from '../model/SysUser';

/**
 * 用户表 数据层接口
 *
 * @author TsMask
 */
export interface ISysUserRepository {
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
   * @param query 查询信息 { roleId:角色ID,allocated:是否已分配 }
   * @param dataScopeSQL 角色数据范围过滤SQL字符串（可选）
   * @return 用户信息集合信息
   */
  selectAllocatedPage(
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
   * 新增用户信息
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  insertUser(sysUser: SysUser): Promise<string>;

  /**
   * 修改用户信息
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  updateUser(sysUser: SysUser): Promise<number>;

  /**
   * 批量删除用户信息
   *
   * @param userIds 需要删除的用户ID
   * @return 结果
   */
  deleteUserByIds(userIds: string[]): Promise<number>;

  /**
   * 校验用户名称是否唯一
   *
   * @param userName 用户名称
   * @return 结果
   */
  checkUniqueUserName(userName: string): Promise<string>;

  /**
   * 校验手机号码是否唯一
   *
   * @param phonenumber 手机号码
   * @return 结果
   */
  checkUniquePhone(phonenumber: string): Promise<string>;

  /**
   * 校验email是否唯一
   *
   * @param email 用户邮箱
   * @return 结果
   */
  checkUniqueEmail(email: string): Promise<string>;
}
