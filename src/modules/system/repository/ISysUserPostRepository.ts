import { SysUserPost } from '../model/SysUserPost';

/**
 * 用户与岗位关联表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysUserPostRepository {
  /**
   * 通过用户ID删除用户和岗位关联
   *
   * @param userId 用户ID
   * @return 结果
   */
  deleteUserPostByUserId(userId: string): Promise<number>;

  /**
   * 通过岗位ID查询岗位使用数量
   *
   * @param postId 岗位ID
   * @return 结果
   */
  countUserPostById(postId: string): Promise<number>;

  /**
   * 批量删除用户和岗位关联
   *
   * @param ids 需要删除的数据ID
   * @return 结果
   */
  deleteUserPost(ids: string[]): Promise<number>;

  /**
   * 批量新增用户岗位信息
   *
   * @param sysUserPostList 用户角色列表
   * @return 结果
   */
  batchUserPost(sysUserPostList: SysUserPost[]): Promise<number>;
}
