import { SysUser } from '../../model/sys_user';

/**
 * 用户表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysUserRepoInterface {
  /**
   * 根据条件分页查询用户列表
   *
   * @param sys_user 用户信息
   * @return 用户信息集合信息
   */
  select_user_list(sys_user: SysUser): Promise<SysUser[]>;

  /**
   * 根据条件分页查询已配用户角色列表
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
   * @param user_id 用户ID
   * @return 用户对象信息
   */
  select_user_by_Id(user_id: string): Promise<SysUser>;

  /**
   * 新增用户信息
   *
   * @param user 用户信息
   * @return 结果
   */
  insert_user(sys_user: SysUser): Promise<number>;

  /**
   * 修改用户信息
   *
   * @param user 用户信息
   * @return 结果
   */
  update_user(sys_user: SysUser): Promise<number>;

  /**
   * 修改用户头像
   *
   * @param user_name 用户名
   * @param avatar 头像地址
   * @return 结果
   */
  update_user_avatar(user_name: string, avatar: string): Promise<number>;

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
   * @param user_id 用户ID
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
   * 校验用户名称是否唯一
   *
   * @param user_name 用户名称
   * @return 结果
   */
  check_unique_user_name(user_name: string): Promise<number>;

  /**
   * 校验手机号码是否唯一
   *
   * @param phonenumber 手机号码
   * @return 结果
   */
  check_unique_phone(phonenumber: string): Promise<SysUser>;

  /**
   * 校验email是否唯一
   *
   * @param email 用户邮箱
   * @return 结果
   */
  check_unique_email(email: string): Promise<SysUser>;
}
