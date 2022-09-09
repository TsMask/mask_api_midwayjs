import { SysUserPost } from '../../model/sys_user_post';

/**
 * 用户与岗位关联表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysUserPostRepoInterface {
  /**
   * 通过用户ID删除用户和岗位关联
   *
   * @param user_id 用户ID
   * @return 结果
   */
  delete_user_post_by_user_id(user_id: string): Promise<number>;

  /**
   * 通过岗位ID查询岗位使用数量
   *
   * @param post_id 岗位ID
   * @return 结果
   */
  count_user_post_by_id(post_id: string): Promise<number>;

  /**
   * 批量删除用户和岗位关联
   *
   * @param ids 需要删除的数据ID
   * @return 结果
   */
  delete_user_post(ids: string[]): Promise<number>;

  /**
   * 批量新增用户岗位信息
   *
   * @param sys_user_post_list 用户角色列表
   * @return 结果
   */
  batch_user_post(sys_user_post_list: SysUserPost[]): Promise<number>;
}
