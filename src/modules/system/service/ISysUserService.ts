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
  * @return 用户信息集合信息
  */
  selectUserPage(query: any): Promise<rowPages>;

  /**
   * 根据条件查询用户列表
   *
   * @param sysUser 用户信息
   * @return 用户信息集合信息
   */
  selectUserList(sysUser: SysUser): Promise<SysUser[]>;

  /**
   * 根据条件分页查询已分配用户角色列表
   *
   * @param sysUser 用户信息
   * @return 用户信息集合信息
   */
  selectAllocatedList(sysUser: SysUser): Promise<SysUser[]>;

  /**
   * 根据条件分页查询未分配用户角色列表
   *
   * @param sysUser 用户信息
   * @return 用户信息集合信息
   */
  selectUnallocatedList(sysUser: SysUser): Promise<SysUser[]>;

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
  insertUser(sysUser: SysUser): Promise<number>;

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
   * 用户授权角色
   *
   * @param userId 用户ID
   * @param roleIds 角色组
   */
  insertAserAuth(userId: string, roleIds: string[]): Promise<boolean>;

  /**
   * 修改用户基本信息
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  updateUserProfile(sysUser: SysUser): Promise<number>;

  /**
   * 修改用户头像
   *
   * @param userName 用户名
   * @param avatar 头像地址
   * @return 结果
   */
  updateUserAvatar(userName: string, avatar: string): Promise<number>;

  /**
   * 重置用户密码
   *
   * @param sysUser 用户信息
   * @return 结果
   */
  resetPwd(sysUser: SysUser): Promise<number>;

  /**
   * 重置用户密码
   *
   * @param userName 用户名
   * @param password 密码
   * @return 结果
   */
  resetUserPwd(userName: string, password: string): Promise<number>;

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
   * @param userList 用户数据列表
   * @param isUpdateSupport 是否更新支持，如果已存在，则进行更新数据
   * @param operName 操作用户
   * @return 结果
   */
  importUser(
    userList: SysUser[],
    isUpdateSupport: boolean,
    operName: string
  ): Promise<string>;
}
