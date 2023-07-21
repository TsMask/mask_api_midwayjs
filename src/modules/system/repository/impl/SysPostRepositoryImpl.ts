import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysPost } from '../../model/SysPost';
import { ISysPostRepository } from '../ISysPostRepository';

/**查询视图对象SQL */
const SELECT_POST_SQL = `select 
post_id, post_code, post_name, post_sort, status, create_by, create_time, remark 
from sys_post`;

/**岗位表信息实体映射 */
const SYS_POST_RESULT = new Map<string, string>();
SYS_POST_RESULT.set('post_id', 'postId');
SYS_POST_RESULT.set('post_code', 'postCode');
SYS_POST_RESULT.set('post_name', 'postName');
SYS_POST_RESULT.set('post_sort', 'postSort');
SYS_POST_RESULT.set('status', 'status');
SYS_POST_RESULT.set('create_by', 'createBy');
SYS_POST_RESULT.set('create_time', 'createTime');
SYS_POST_RESULT.set('update_by', 'updateBy');
SYS_POST_RESULT.set('update_time', 'updateTime');
SYS_POST_RESULT.set('remark', 'remark');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysPost[] {
  const sysPosts: SysPost[] = [];
  for (const row of rows) {
    const sysPost = new SysPost();
    for (const key in row) {
      if (SYS_POST_RESULT.has(key)) {
        const keyMapper = SYS_POST_RESULT.get(key);
        sysPost[keyMapper] = row[key];
      }
    }
    sysPosts.push(sysPost);
  }
  return sysPosts;
}

/**
 * 角色表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysPostRepositoryImpl implements ISysPostRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectPostPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.postCode) {
      conditions.push("post_code like concat(?, '%')");
      params.push(query.postCode);
    }
    if (query.postName) {
      conditions.push("post_name like concat(?, '%')");
      params.push(query.postName);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_post";
    const countRow: RowTotalType[] = await this.db.execute(
      totalSql + whereSql,
      params
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_POST_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectPostList(sysPost: SysPost): Promise<SysPost[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysPost.postCode) {
      conditions.push("post_code like concat(?, '%')");
      params.push(sysPost.postCode);
    }
    if (sysPost.postName) {
      conditions.push("post_name like concat(?, '%')");
      params.push(sysPost.postName);
    }
    if (sysPost.status) {
      conditions.push('status = ?');
      params.push(sysPost.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_POST_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectPostById(postId: string): Promise<SysPost> {
    const sqlStr = `${SELECT_POST_SQL} where post_id = ? `;
    const rows = await this.db.execute(sqlStr, [postId]);
    return convertResultRows(rows)[0] || null;
  }

  async selectPostListByUserId(userId: string): Promise<SysPost[]> {
    const sqlStr = `select p.post_id, p.post_name, p.post_code 
    from sys_post p 
    left join sys_user_post up on up.post_id = p.post_id 
    left join sys_user u on u.user_id = up.user_id 
    where u.user_id = ? `;
    const rows = await this.db.execute(sqlStr, [userId]);
    return convertResultRows(rows);
  }
  
  async deletePostByIds(postIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_post where post_id in (${postIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, postIds);
    return result.affectedRows;
  }

  async updatePost(sysPost: SysPost): Promise<number> {
    const paramMap = new Map();
    if (sysPost.postCode) {
      paramMap.set('post_code', sysPost.postCode);
    }
    if (sysPost.postName) {
      paramMap.set('post_name', sysPost.postName);
    }
    if (sysPost.postSort >= 0) {
      paramMap.set('post_sort', parseNumber(sysPost.postSort));
    }
    if (sysPost.status) {
      paramMap.set('status', parseNumber(sysPost.status));
    }
    if (sysPost.remark) {
      paramMap.set('remark', sysPost.remark);
    }
    if (sysPost.updateBy) {
      paramMap.set('update_by', sysPost.updateBy);
      paramMap.set('update_time', Date.now());
    }
    const sqlStr = `update sys_post set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where post_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysPost.postId,
    ]);
    return result.affectedRows;
  }

  async insertPost(sysPost: SysPost): Promise<string> {
    const paramMap = new Map();
    if (sysPost.postId) {
      paramMap.set('post_id', sysPost.postId);
    }
    if (sysPost.postCode) {
      paramMap.set('post_code', sysPost.postCode);
    }
    if (sysPost.postName) {
      paramMap.set('post_name', sysPost.postName);
    }
    if (sysPost.postSort >= 0) {
      paramMap.set('post_sort', parseNumber(sysPost.postSort));
    }
    if (sysPost.status) {
      paramMap.set('status', parseNumber(sysPost.status));
    }
    if (sysPost.remark) {
      paramMap.set('remark', sysPost.remark);
    }
    if (sysPost.createBy) {
      paramMap.set('create_by', sysPost.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_post (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async checkUniquePost(sysPost: SysPost): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysPost.postName) {
      conditions.push('post_name= ?');
      params.push(sysPost.postName);
    }
    if (sysPost.postCode) {
      conditions.push('post_code = ?');
      params.push(sysPost.postName);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return null;
    }

    const sqlStr =
      "select post_id as 'str' from sys_post " + whereSql + ' limit 1';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
    return rows.length > 0 ? rows[0].str : null;
  }
}
