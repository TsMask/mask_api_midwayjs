import { Provide, Inject } from '@midwayjs/decorator';
import { SysPost } from '../../model/SysPost';
import { SysPostRepositoryImpl } from '../../repository/impl/SysPostRepositoryImpl';
import { SysUserPostRepositoryImpl } from '../../repository/impl/SysUserPostRepositoryImpl';
import { ISysPostService } from '../ISysPostService';

/**
 * 岗位 业务层处理
 *
 * @author TsMask
 */
@Provide()
export class SysPostServiceImpl implements ISysPostService {
  @Inject()
  private sysPostRepository: SysPostRepositoryImpl;

  @Inject()
  private sysUserPostRepository: SysUserPostRepositoryImpl;

  async selectPostPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysPostRepository.selectPostPage(query);
  }

  async selectPostList(sysPost: SysPost): Promise<SysPost[]> {
    return await this.sysPostRepository.selectPostList(sysPost);
  }

  async selectPostById(postId: string): Promise<SysPost> {
    if (!postId) return null;
    const posts = await this.sysPostRepository.selectPostByIds([postId]);
    if (posts.length > 0) {
      return posts[0];
    }
    return null;
  }

  async selectPostListByUserId(userId: string): Promise<SysPost[]> {
    return await this.sysPostRepository.selectPostListByUserId(userId);
  }

  async deletePostByIds(postIds: string[]): Promise<number> {
    const posts = await this.sysPostRepository.selectPostByIds(postIds);
    if (posts.length <= 0) {
      throw new Error('没有权限访问岗位数据！');
    }
    for (const post of posts) {
      const useCount = await this.sysUserPostRepository.countUserPostByPostId(
        post.postId
      );
      if (useCount > 0) {
        throw new Error(`【${post.postName}】已分配给用户,不能删除`);
      }
    }
    if (posts.length === postIds.length) {
      return await this.sysPostRepository.deletePostByIds(postIds);
    }
    return 0;
  }

  async insertPost(sysPost: SysPost): Promise<string> {
    return await this.sysPostRepository.insertPost(sysPost);
  }

  async updatePost(sysPost: SysPost): Promise<number> {
    return await this.sysPostRepository.updatePost(sysPost);
  }

  async checkUniquePostName(
    postName: string,
    postId: string = ''
  ): Promise<boolean> {
    const sysPost = new SysPost();
    sysPost.postName = postName;
    const uniqueId = await this.sysPostRepository.checkUniquePost(sysPost);
    if (uniqueId === postId) {
      return true;
    }
    return !uniqueId;
  }

  async checkUniquePostCode(
    postCode: string,
    postId: string = ''
  ): Promise<boolean> {
    const sysPost = new SysPost();
    sysPost.postCode = postCode;
    const uniqueId = await this.sysPostRepository.checkUniquePost(sysPost);
    if (uniqueId === postId) {
      return true;
    }
    return !uniqueId;
  }
}
