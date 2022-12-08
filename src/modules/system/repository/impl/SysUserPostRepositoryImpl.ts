import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { SysUserPost } from '../../model/SysUserPost';
import { ISysUserPostRepository } from '../ISysUserPostRepository';

/**
 * 用户与岗位关联表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysUserPostRepositoryImpl implements ISysUserPostRepository {
  @Inject()
  public db: MysqlManager;

  async deleteUserPostByUserId(userId: string): Promise<number> {
    const sqlStr = 'delete from sys_user_post where user_id = ?';
    const result: ResultSetHeader = await this.db.execute(sqlStr, [userId]);
    return result.affectedRows;
  }
  countUserPostById(postId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async deleteUserPost(userIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_user_post where user_id in (${userIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, userIds);
    return result.affectedRows;
  }
  async batchUserPost(sysUserPosts: SysUserPost[]): Promise<number> {
    const sqlStr = `insert into sys_user_post(user_id, post_id) values ${sysUserPosts
      .map(item => `(${item.userId},${item.postId})`)
      .join(',')}`;
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.insertId;
  }
}
