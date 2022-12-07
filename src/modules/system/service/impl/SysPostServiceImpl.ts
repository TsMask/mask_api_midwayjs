import { Provide, Inject } from '@midwayjs/decorator';
import { SysPost } from '../../model/SysPost';
import { SysPostRepositoryImpl } from '../../repository/impl/SysPostRepositoryImpl';
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
  deletePostById(postId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async deletePostByIds(postIds: string[]): Promise<number> {
    return await this.sysPostRepository.deletePostByIds(postIds);
  }
  async insertPost(sysPost: SysPost): Promise<number> {
    return await this.sysPostRepository.insertPost(sysPost);
  }
  async updatePost(sysPost: SysPost): Promise<number> {
    return await this.sysPostRepository.updatePost(sysPost);
  }

}
