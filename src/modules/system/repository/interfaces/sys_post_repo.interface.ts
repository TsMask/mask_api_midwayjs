import { SysPost } from '../../model/sys_post';

/**
 * 岗位信息 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysPostRepoInterface {
  /**
   * 查询岗位数据集合
   *
   * @param sys_post 岗位信息
   * @return 岗位数据集合
   */
  select_post_list(sys_post: SysPost): Promise<SysPost[]>;

  /**
   * 查询所有岗位
   *
   * @return 岗位列表
   */
  select_post_all(): Promise<SysPost[]>;

  /**
   * 通过岗位ID查询岗位信息
   *
   * @param post_id 岗位ID
   * @return 角色对象信息
   */
  select_post_by_id(post_id: string): Promise<SysPost>;

  /**
   * 根据用户ID获取岗位选择框列表
   *
   * @param user_id 用户ID
   * @return 选中岗位ID列表
   */
  select_post_list_by_user_id(user_id: string): Promise<string[]>;

  /**
   * 查询用户所属岗位组
   *
   * @param user_name 用户名
   * @return 结果
   */
  select_posts_by_user_name(user_name: string): Promise<SysPost[]>;

  /**
   * 删除岗位信息
   *
   * @param post_id 岗位ID
   * @return 结果
   */
  delete_post_by_id(post_id: string): Promise<number>;

  /**
   * 批量删除岗位信息
   *
   * @param post_ids 需要删除的岗位ID
   * @return 结果
   */
  delete_post_by_ids(post_ids: string[]): Promise<number>;

  /**
   * 修改岗位信息
   *
   * @param sys_post 岗位信息
   * @return 结果
   */
  update_post(sys_post: SysPost): Promise<number>;

  /**
   * 新增岗位信息
   *
   * @param sys_post 岗位信息
   * @return 结果
   */
  insert_post(sys_post: SysPost): Promise<number>;

  /**
   * 校验岗位名称
   *
   * @param post_name 岗位名称
   * @return 结果
   */
  check_unique_post_name(post_name: string): Promise<SysPost>;

  /**
   * 校验岗位编码
   *
   * @param post_code 岗位编码
   * @return 结果
   */
  check_unique_post_code(post_code: string): Promise<SysPost>;
}
