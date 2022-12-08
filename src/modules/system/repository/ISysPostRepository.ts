import { SysPost } from '../model/SysPost';

/**
 * 岗位信息 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysPostRepository {
  /**
   * 查询岗位分页数据集合
   *
   * @param query 分页数据
   * @return 岗位数据集合
   */
  selectPostPage(query: any): Promise<rowPages>;

  /**
   * 查询岗位数据集合
   *
   * @param sysPost 岗位信息
   * @return 岗位数据集合
   */
  selectPostList(sysPost: SysPost): Promise<SysPost[]>;

  /**
   * 查询所有岗位
   *
   * @return 岗位列表
   */
  selectPostAll(): Promise<SysPost[]>;

  /**
   * 通过岗位ID查询岗位信息
   *
   * @param postId 岗位ID
   * @return 角色对象信息
   */
  selectPostById(postId: string): Promise<SysPost>;

  /**
   * 根据用户ID获取岗位选择框列表
   *
   * @param userId 用户ID
   * @return 选中岗位ID列表
   */
  selectPostListByUserId(userId: string): Promise<string[]>;

  /**
   * 查询用户所属岗位组
   *
   * @param userName 用户名
   * @return 结果
   */
  selectPostsByUserName(userName: string): Promise<SysPost[]>;

  /**
   * 删除岗位信息
   *
   * @param postId 岗位ID
   * @return 结果
   */
  deletePostById(postId: string): Promise<number>;

  /**
   * 批量删除岗位信息
   *
   * @param postIds 需要删除的岗位ID
   * @return 结果
   */
  deletePostByIds(postIds: string[]): Promise<number>;

  /**
   * 修改岗位信息
   *
   * @param sysPost 岗位信息
   * @return 结果
   */
  updatePost(sysPost: SysPost): Promise<number>;

  /**
   * 新增岗位信息
   *
   * @param sysPost 岗位信息
   * @return 结果
   */
  insertPost(sysPost: SysPost): Promise<number>;
}
