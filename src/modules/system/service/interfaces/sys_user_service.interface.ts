import { SysUser } from '../../../../framework/core/model/sys_user';

/**
 * 用户 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysUserServiceInterface {
  /**
   * 根据条件分页查询用户列表
   *
   * @param sys_user 用户信息
   * @return 用户信息集合信息
   */
  select_user_List(sys_user: SysUser): Promise<[SysUser[], number]>;

  /**
   * 根据条件分页查询已分配用户角色列表
   *
   * @param sys_user 用户信息
   * @return 用户信息集合信息
   */
  select_allocated_list(sys_user: SysUser): Promise<SysUser[]>;

  /**
   * 根据条件分页查询未分配用户角色列表
   *
   * @param sys_user 用户信息
   * @return 用户信息集合信息
   */
  select_unallocated_list(sys_user: SysUser): Promise<SysUser[]>;

  /**
   * 通过用户名查询用户
   *
   * @param user_name 用户名
   * @return 用户对象信息
   */
  select_user_by_user_name(user_name: string): Promise<SysUser>;

  /**
   * 通过用户ID查询用户
   *
   * @param userId 用户ID
   * @return 用户对象信息
   */
  select_user_by_id(user_id: string): Promise<SysUser>;

  /**
   * 根据用户ID查询用户所属角色组
   *
   * @param user_name 用户名
   * @return 结果
   */
  select_user_role_group(user_name: string): Promise<string>;

  /**
   * 根据用户ID查询用户所属岗位组
   *
   * @param user_name 用户名
   * @return 结果
   */
  select_user_post_group(user_name: string): Promise<string>;

  /**
   * 校验用户名称是否唯一
   *
   * @param user_name 用户名称
   * @return 结果
   */
  check_unique_user_name(user_name: string): Promise<string>;

  /**
   * 校验手机号码是否唯一
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  check_unique_phone(sys_user: SysUser): Promise<string>;

  /**
   * 校验email是否唯一
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  check_email_unique(sys_user: SysUser): Promise<string>;

  /**
   * 校验用户是否允许操作
   *
   * @param sys_user 用户信息
   */
  check_user_allowed(sys_user: SysUser): Promise<boolean>;

  /**
   * 校验用户是否有数据权限
   *
   * @param userId 用户id
   */
  check_user_data_scope(user_id: string): Promise<boolean>;

  /**
   * 新增用户信息
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  insert_user(sys_user: SysUser): Promise<number>;

  /**
   * 注册用户信息
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  register_user(sys_user: SysUser): Promise<boolean>;

  /**
   * 修改用户信息
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  update_user(sys_user: SysUser): Promise<number>;

  /**
   * 用户授权角色
   *
   * @param userId 用户ID
   * @param roleIds 角色组
   */
  insert_user_auth(user_id: string, role_ids: string[]): Promise<boolean>;

  /**
   * 修改用户状态
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  update_user_status(sys_user: SysUser): Promise<number>;

  /**
   * 修改用户基本信息
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  update_user_profile(sys_user: SysUser): Promise<number>;

  /**
   * 修改用户头像
   *
   * @param user_name 用户名
   * @param avatar 头像地址
   * @return 结果
   */
  update_user_avatar(user_name: string, avatar: string): Promise<boolean>;

  /**
   * 重置用户密码
   *
   * @param sys_user 用户信息
   * @return 结果
   */
  reset_pwd(sys_user: SysUser): Promise<number>;

  /**
   * 重置用户密码
   *
   * @param user_name 用户名
   * @param password 密码
   * @return 结果
   */
  reset_user_pwd(user_name: string, password: string): Promise<number>;

  /**
   * 通过用户ID删除用户
   *
   * @param userId 用户ID
   * @return 结果
   */
  delete_user_by_id(user_id: string): Promise<number>;

  /**
   * 批量删除用户信息
   *
   * @param user_ids 需要删除的用户ID
   * @return 结果
   */
  delete_user_by_ids(user_ids: string[]): Promise<number>;

  /**
   * 导入用户数据
   *
   * @param user_list 用户数据列表
   * @param is_update_support 是否更新支持，如果已存在，则进行更新数据
   * @param oper_name 操作用户
   * @return 结果
   */
  import_user(
    user_list: SysUser[],
    is_update_support: boolean,
    oper_name: string
  ): Promise<string>;
}
