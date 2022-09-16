import { SysPost } from '../../model/sys_post';

/**
 * 岗位信息 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysPostServiceInterface {
  /**
   * 查询岗位信息集合
   *
   * @param sys_post 岗位信息
   * @return 岗位列表
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
  selectPostListByUserId(user_id: string): Promise<string[]>;

  /**
   * 校验岗位名称
   *
   * @param sys_post 岗位信息
   * @return 结果
   */
  check_unique_post_name(sys_post: SysPost): Promise<string>;

  /**
   * 校验岗位编码
   *
   * @param sys_post 岗位信息
   * @return 结果
   */
  check_unique_post_code(sys_post: SysPost): Promise<string>;

  /**
   * 通过岗位ID查询岗位使用数量
   *
   * @param post_id 岗位ID
   * @return 结果
   */
  count_user_post_by_id(post_id: string): Promise<string>;

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
   * 新增保存岗位信息
   *
   * @param sys_post 岗位信息
   * @return 结果
   */
  insert_post(sys_post: SysPost): Promise<number>;

  /**
   * 修改保存岗位信息
   *
   * @param sys_post 岗位信息
   * @return 结果
   */
  update_post(sys_post: SysPost): Promise<number>;
}
