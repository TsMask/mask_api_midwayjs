import { SysPost } from '../model/SysPost';

/**
 * 岗位信息 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysPostService {
  /**
   * 查询岗位信息集合
   *
   * @param sysPost 岗位信息
   * @return 岗位列表
   */
  selectPostList(sysPost: SysPost): Promise<SysPost[]>;

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
   * 通过岗位ID查询岗位使用数量
   *
   * @param postId 岗位ID
   * @return 结果
   */
  countUserPostById(postId: string): Promise<string>;

  /**
   * 批量删除岗位信息
   *
   * @param postIds 需要删除的岗位ID
   * @return 结果
   */
  deletePostByIds(postIds: string[]): Promise<number>;

  /**
   * 新增保存岗位信息
   *
   * @param sysPost 岗位信息
   * @return 结果
   */
  insertPost(sysPost: SysPost): Promise<string>;

  /**
   * 修改保存岗位信息
   *
   * @param sysPost 岗位信息
   * @return 结果
   */
  updatePost(sysPost: SysPost): Promise<number>;

  /**
   * 校验岗位名称
   *
   * @param sysPost 岗位信息
   * @return 结果
   */
  checkUniquePostName(sysPost: SysPost): Promise<boolean>;

  /**
   * 校验岗位编码
   *
   * @param sysPost 岗位信息
   * @return 结果
   */
  checkUniquePostCode(sysPost: SysPost): Promise<boolean>;
}
