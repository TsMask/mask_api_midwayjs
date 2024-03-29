import { Provide, Inject, Singleton } from '@midwayjs/core';
import { ResultSetHeader } from 'mysql2';
import {
  YYYY_MM_DD,
  parseStrToDate,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysNoticeRepository } from '../ISysNoticeRepository';
import { SysNotice } from '../../model/SysNotice';

/**查询视图对象SQL */
const SELECT_NOTICE_SQL = `select 
notice_id, notice_title, notice_type, notice_content, status, del_flag, 
create_by, create_time, update_by, update_time, remark from sys_notice`;

/**公告表信息实体映射 */
const SYS_NOTICE_RESULT = new Map<string, string>();
SYS_NOTICE_RESULT.set('notice_id', 'noticeId');
SYS_NOTICE_RESULT.set('notice_title', 'noticeTitle');
SYS_NOTICE_RESULT.set('notice_type', 'noticeType');
SYS_NOTICE_RESULT.set('notice_content', 'noticeContent');
SYS_NOTICE_RESULT.set('status', 'status');
SYS_NOTICE_RESULT.set('del_flag', 'delFlag');
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
function convertResultRows(rows: any[]): SysNotice[] {
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
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysNoticeRepositoryImpl implements ISysNoticeRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectNoticePage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.noticeTitle) {
      conditions.push("notice_title like concat(?, '%')");
      params.push(query.noticeTitle);
    }
    if (query.noticeType) {
      conditions.push('notice_type = ?');
      params.push(query.noticeType);
    }
    if (query.createBy) {
      conditions.push("create_by like concat(?, '%')");
      params.push(query.createBy);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      conditions.push('create_time >= ?');
      params.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      conditions.push('create_time <= ?');
      params.push(endDate);
    }

    // 构建查询条件语句
    let whereSql = " where del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_notice";
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
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_NOTICE_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectNoticeList(sysNotice: SysNotice): Promise<SysNotice[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    // 查询条件拼接
    if (sysNotice.noticeTitle) {
      conditions.push("notice_title like concat(?, '%')");
      params.push(sysNotice.noticeTitle);
    }
    if (sysNotice.noticeType) {
      conditions.push('notice_type = ?');
      params.push(sysNotice.noticeType);
    }
    if (sysNotice.createBy) {
      conditions.push("create_by like concat(?, '%')");
      params.push(sysNotice.createBy);
    }

    // 构建查询条件语句
    let whereSql = " where del_flag = '0' ";
    if (conditions.length > 0) {
      whereSql += ' and ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_NOTICE_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectNoticeByIds(noticeIds: string[]): Promise<SysNotice[]> {
    const placeholder = this.db.keyPlaceholderByQuery(noticeIds.length);
    const sqlStr = `${SELECT_NOTICE_SQL} where notice_id in (${placeholder})`;
    const rows = await this.db.execute(sqlStr, noticeIds);
    return convertResultRows(rows);
  }

  async insertNotice(sysNotice: SysNotice): Promise<string> {
    const paramMap = new Map();
    if (sysNotice.noticeTitle) {
      paramMap.set('notice_title', sysNotice.noticeTitle);
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

    const [keys, values, placeholder] =
      this.db.keyValuePlaceholderByInsert(paramMap);
    const sqlStr = `insert into sys_notice (${keys})values(${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, values);
    return `${result.insertId}`;
  }

  async updateNotice(sysNotice: SysNotice): Promise<number> {
    const paramMap = new Map();
    if (sysNotice.noticeTitle) {
      paramMap.set('notice_title', sysNotice.noticeTitle);
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
    paramMap.set('remark', sysNotice.remark || "");
    if (sysNotice.updateBy) {
      paramMap.set('update_by', sysNotice.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const [keys, values] = this.db.keyValueByUpdate(paramMap);
    const sqlStr = `update sys_notice set ${keys} where notice_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...values,
      sysNotice.noticeId,
    ]);
    return result.affectedRows;
  }

  async deleteNoticeByIds(noticeIds: string[]): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(noticeIds.length);
    const sqlStr = `update sys_notice set del_flag = '1' where notice_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, noticeIds);
    return result.affectedRows;
  }
}
