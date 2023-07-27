import { SysPost } from '../model/SysPost';

/**
 * 岗位信息 服务层接口
 *
 * @author TsMask
 */
export interface ISysPostService {
  /**
   * 查询分页岗位信息列表
   *
   * @param query 岗位信息查询
   * @return 岗位列表
   */
  selectPostPage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 查询岗位信息列表
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
   * @return 岗位数据集合
   */
  selectPostListByUserId(userId: string): Promise<SysPost[]>;

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
   * 校验岗位名称唯一
   *
   * @param postName 岗位名称
   * @param postId 岗位ID，更新时传入
   * @return 结果
   */
  checkUniquePostName(postName: string, postId: string): Promise<boolean>;

  /**
   * 校验岗位编码唯一
   *
   * @param postCode 岗位编码
   * @param postId 岗位ID，更新时传入
   * @return 结果
   */
  checkUniquePostCode(postCode: string, postId: string): Promise<boolean>;
}
