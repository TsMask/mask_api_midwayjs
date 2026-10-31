import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, EntityManager, In, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysUserPost } from '../model/sys_user_post';

/**用户与岗位关联表 数据层处理 */
@Provide()
@Singleton()
export class SysUserPostRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 存在用户使用数量
   * @param postId 岗位ID
   * @returns 数量
   */
  public async existUserByPostId(postId: number): Promise<number> {
    if (postId <= 0) {
      return 0;
    }
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUserPost, 's')
      .andWhere('s.post_id = :postId', { postId })
      .getCount();
    return count;
  }

  /**
   * 通过用户ID数组删除关联岗位
   * @param userIds 用户ID数组
   * @param entityManager 事务EntityManager（可选）
   * @returns 影响记录数
   */
  public async deleteByUserIds(
    userIds: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (userIds.length <= 0) {
      return 0;
    }
    if (entityManager) {
      const result: DeleteResult = await entityManager.delete(SysUserPost, {
        userId: In(userIds),
      });
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysUserPost)
      .andWhere('user_id in (:userIds)', { userIds })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量新增
   * @param sysUserPosts 用户岗位关联数组
   * @param entityManager 事务EntityManager（可选）
   * @returns 影响记录数
   */
  public async batchInsert(
    sysUserPosts: SysUserPost[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (sysUserPosts.length <= 0) {
      return 0;
    }
    if (entityManager) {
      const result: InsertResult = await entityManager.insert(
        SysUserPost,
        sysUserPosts
      );
      return result.raw.affectedRows > 0 ? result.raw.affectedRows : 0;
    }
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysUserPost)
      .values(sysUserPosts)
      .execute();
    return tx.raw.affectedRows > 0 ? tx.raw.affectedRows : 0;
  }
}
