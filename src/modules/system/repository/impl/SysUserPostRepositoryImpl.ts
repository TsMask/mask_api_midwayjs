import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysUserPost } from '../../model/SysUserPost';
import { ISysUserPostRepository } from '../ISysUserPostRepository';
import { ResultSetHeader } from 'mysql2';

/**
 * 用户与岗位关联表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysUserPostRepositoryImpl implements ISysUserPostRepository {
  @Inject()
  public db: DynamicDataSource;

  async countUserPostByPostId(postId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_user_post where post_id = ?";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [postId]);
    return parseNumber(countRow[0].total);
  }

  async batchUserPost(sysUserPosts: SysUserPost[]): Promise<number> {
    const sqlStr = `insert into sys_user_post(user_id, post_id) values ${sysUserPosts
      .map(item => `(${item.userId},${item.postId})`)
      .join(',')}`;
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.affectedRows;
  }

  async deleteUserPost(userIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_user_post where user_id in (${userIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, userIds);
    return result.affectedRows;
  }
}
