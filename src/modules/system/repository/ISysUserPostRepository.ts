import { SysUserPost } from '../model/SysUserPost';

/**
 * 用户与岗位关联表 数据层接口
 *
 * @author TsMask
 */
export interface ISysUserPostRepository {
  /**
   * 通过岗位ID查询岗位使用数量
   *
   * @param postId 岗位ID
   * @return 结果
   */
  countUserPostByPostId(postId: string): Promise<number>;

  /**
   * 批量删除用户和岗位关联
   *
   * @param userIds 需要删除的用户ID
   * @return 结果
   */
  deleteUserPost(userIds: string[]): Promise<number>;

  /**
   * 批量新增用户岗位信息
   *
   * @param sysUserPosts 用户角色列表
   * @return 结果
   */
  batchUserPost(sysUserPosts: SysUserPost[]): Promise<number>;
}
