import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysNotice } from '../../model/SysNotice';
import { ISysNoticeRepository } from '../ISysNoticeRepository';

/**查询视图对象SQL */
const SELECT_NOTICE_VO = `select notice_id, notice_title, notice_type, 
cast(notice_content as char) as notice_content, status, create_by, 
create_time, update_by, update_time, remark from sys_notice`;

/**公告表信息实体映射 */
const SYS_NOTICE_RESULT = new Map<string, string>();
SYS_NOTICE_RESULT.set('notice_id', 'noticeId');
SYS_NOTICE_RESULT.set('notice_title', 'noticeTitle');
SYS_NOTICE_RESULT.set('notice_type', 'noticeType');
SYS_NOTICE_RESULT.set('notice_content', 'noticeContent');
SYS_NOTICE_RESULT.set('status', 'status');
SYS_NOTICE_RESULT.set('create_by', 'createBy');
SYS_NOTICE_RESULT.set('create_time', 'createTime');
SYS_NOTICE_RESULT.set('update_by', 'updateBy');
SYS_NOTICE_RESULT.set('update_time', 'updateTime');
SYS_NOTICE_RESULT.set('remark', 'remark');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysNoticeResult(rows: any[]): SysNotice[] {
  const sysNotices: SysNotice[] = [];
  for (const row of rows) {
    const sysNotice = new SysNotice();
    for (const key in row) {
      if (SYS_NOTICE_RESULT.has(key)) {
        const keyMapper = SYS_NOTICE_RESULT.get(key);
        sysNotice[keyMapper] = row[key];
      }
    }
    sysNotices.push(sysNotice);
  }
  return sysNotices;
}

/**
 * 公告表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysNoticeRepositoryImpl implements ISysNoticeRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectNoticePage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (query.noticeTitle) {
      sqlStr += " and notice_title like concat('%', ?, '%') ";
      paramArr.push(query.noticeTitle);
    }
    if (query.noticeType) {
      sqlStr += ' and notice_type = ? ';
      paramArr.push(query.noticeType);
    }
    if (query.createBy) {
      sqlStr += " and create_by like concat('%', ?, '%') ";
      paramArr.push(query.createBy);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: RowTotalType[] = await this.db.execute(
      `select count(1) as 'total' from sys_notice where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 50 ? pageNum : 50;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 100 ? pageSize : 100;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);
    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_NOTICE_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysNoticeResult(results);
    return { total, rows };
  }

  async selectNoticeList(sysNotice: SysNotice): Promise<SysNotice[]> {
    let sqlStr = `${SELECT_NOTICE_VO} where 1 = 1 `;
    const paramArr = [];
    // 查询条件拼接
    if (sysNotice.noticeTitle) {
      sqlStr += " and notice_title like concat('%', ?, '%') ";
      paramArr.push(sysNotice.noticeTitle);
    }
    if (sysNotice.noticeType) {
      sqlStr += ' and notice_type = ? ';
      paramArr.push(sysNotice.noticeType);
    }
    if (sysNotice.createBy) {
      sqlStr += " and create_by like concat('%', ?, '%') ";
      paramArr.push(sysNotice.createBy);
    }

    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysNoticeResult(rows);
  }

  async selectNoticeById(noticeId: string): Promise<SysNotice> {
    const sqlStr = `${SELECT_NOTICE_VO} where notice_id = ? `;
    const rows = await this.db.execute(sqlStr, [noticeId]);
    return parseSysNoticeResult(rows)[0] || null;
  }

  async insertNotice(sysNotice: SysNotice): Promise<string> {
    const paramMap = new Map();
    if (sysNotice.noticeTitle) {
      paramMap.set('notice_title', sysNotice.noticeTitle.trim());
    }
    if (sysNotice.noticeType) {
      paramMap.set('notice_type', parseNumber(sysNotice.noticeType));
    }
    if (sysNotice.noticeContent) {
      paramMap.set('notice_content', sysNotice.noticeContent);
    }
    if (sysNotice.status) {
      paramMap.set('status', parseNumber(sysNotice.status));
    }
    if (sysNotice.remark) {
      paramMap.set('remark', sysNotice.remark);
    }
    if (sysNotice.createBy) {
      paramMap.set('create_by', sysNotice.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_notice (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async updateNotice(sysNotice: SysNotice): Promise<number> {
    const paramMap = new Map();
    if (sysNotice.noticeTitle) {
      paramMap.set('notice_title', sysNotice.noticeTitle.trim());
    }
    if (sysNotice.noticeType) {
      paramMap.set('notice_type', parseNumber(sysNotice.noticeType));
    }
    if (sysNotice.noticeContent) {
      paramMap.set('notice_content', sysNotice.noticeContent);
    }
    if (sysNotice.status) {
      paramMap.set('status', parseNumber(sysNotice.status));
    }
    if (sysNotice.remark) {
      paramMap.set('remark', sysNotice.remark);
    }
    if (sysNotice.updateBy) {
      paramMap.set('update_by', sysNotice.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const sqlStr = `update sys_notice set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where notice_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysNotice.noticeId,
    ]);
    return result.affectedRows;
  }

  async deleteNoticeById(noticeId: string): Promise<number> {
    const sqlStr = 'delete from sys_notice where notice_id = ?';
    const result: ResultSetHeader = await this.db.execute(sqlStr, [noticeId]);
    return result.affectedRows;
  }

  async deleteNoticeByIds(noticeIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_notice where notice_id in (${noticeIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, noticeIds);
    return result.affectedRows;
  }
}
