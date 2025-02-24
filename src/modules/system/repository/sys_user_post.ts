import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
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
   * 批量删除关联By用户
   *
   * @param userIds ID数组
   * @return 影响记录数
   */
  public async deleteByUserIds(userIds: number[]): Promise<number> {
    if (userIds.length <= 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysUserPost)
      .andWhere('user_id in (:userIds)', { userIds })
      .execute();
    return tx.affected;
  }

  /**
   * 批量新增信息
   *
   * @param userRoles 信息
   * @return 影响记录数
   */
  public async batchInsert(sysUserPosts: SysUserPost[]): Promise<number> {
    if (sysUserPosts.length <= 0) return 0;
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysUserPost)
      .values(sysUserPosts)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.affectedRows > 0) {
      return raw.affectedRows;
    }
    return 0;
  }
}
