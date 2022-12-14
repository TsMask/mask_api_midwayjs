import { Provide, Inject } from '@midwayjs/decorator';
import { SysPost } from '../../model/SysPost';
import { SysPostRepositoryImpl } from '../../repository/impl/SysPostRepositoryImpl';
import { SysUserPostRepositoryImpl } from '../../repository/impl/SysUserPostRepositoryImpl';
import { ISysPostService } from '../ISysPostService';

/**
 * 岗位 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysPostServiceImpl implements ISysPostService {
  @Inject()
  private sysPostRepository: SysPostRepositoryImpl;

  @Inject()
  private sysUserPostRepository: SysUserPostRepositoryImpl;

  async selectPostPage(query: any): Promise<rowPages> {
    return await this.sysPostRepository.selectPostPage(query);
  }

  async selectPostList(sysPost: SysPost): Promise<SysPost[]> {
    return await this.sysPostRepository.selectPostList(sysPost);
  }

  async selectPostById(postId: string): Promise<SysPost> {
    return await this.sysPostRepository.selectPostById(postId);
  }

  async selectPostListByUserId(userId: string): Promise<string[]> {
    return await this.sysPostRepository.selectPostListByUserId(userId);
  }

  countUserPostById(postId: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  async deletePostByIds(postIds: string[]): Promise<number> {
    for (const postId of postIds) {
      // 检查是否存在
      const post = await this.selectPostById(postId);
      if (!post) {
        throw new Error('没有权限访问岗位数据！');
      }
      const useCount = await this.sysUserPostRepository.countUserPostByPostId(
        postId
      );
      if (useCount > 0) {
        throw new Error(`【${post.postName}】已分配给用户,不能删除`);
      }
    }
    return await this.sysPostRepository.deletePostByIds(postIds);
  }

  async insertPost(sysPost: SysPost): Promise<string> {
    return await this.sysPostRepository.insertPost(sysPost);
  }

  async updatePost(sysPost: SysPost): Promise<number> {
    return await this.sysPostRepository.updatePost(sysPost);
  }

  async checkUniquePostName(sysPost: SysPost): Promise<boolean> {
    const postId = await this.sysPostRepository.checkUniquePostName(
      sysPost.postName
    );
    // 岗位信息与查询得到岗位ID一致
    if (postId && sysPost.postId === postId) {
      return true;
    }
    return !postId;
  }

  async checkUniquePostCode(sysPost: SysPost): Promise<boolean> {
    const postId = await this.sysPostRepository.checkUniquePostCode(
      sysPost.postCode
    );
    // 岗位信息与查询得到岗位ID一致
    if (postId && sysPost.postId === postId) {
      return true;
    }
    return !postId;
  }
}
