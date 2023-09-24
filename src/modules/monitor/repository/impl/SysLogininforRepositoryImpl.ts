import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysLogininfor } from '../../model/SysLogininfor';
import { ISysLogininforRepository } from '../ISysLogininforRepository';
import { ResultSetHeader } from 'mysql2';

/**查询视图对象SQL */
const SELECT_LOGININFOR_SQL = `select info_id, user_name, ipaddr, login_location, 
browser, os, status, msg, login_time from sys_logininfor`;

/**系统访问记录表信息实体映射 */
const SYS_LOGININFOR_RESULT = new Map<string, string>();
SYS_LOGININFOR_RESULT.set('info_id', 'infoId');
SYS_LOGININFOR_RESULT.set('user_name', 'userName');
SYS_LOGININFOR_RESULT.set('status', 'status');
SYS_LOGININFOR_RESULT.set('ipaddr', 'ipaddr');
SYS_LOGININFOR_RESULT.set('login_location', 'loginLocation');
SYS_LOGININFOR_RESULT.set('browser', 'browser');
SYS_LOGININFOR_RESULT.set('os', 'os');
SYS_LOGININFOR_RESULT.set('msg', 'msg');
SYS_LOGININFOR_RESULT.set('login_time', 'loginTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysLogininfor[] {
  const sysLogininfors: SysLogininfor[] = [];
  for (const row of rows) {
    const sysLogininfor = new SysLogininfor();
    for (const key in row) {
      if (SYS_LOGININFOR_RESULT.has(key)) {
        const keyMapper = SYS_LOGININFOR_RESULT.get(key);
        sysLogininfor[keyMapper] = row[key];
      }
    }
    sysLogininfors.push(sysLogininfor);
  }
  return sysLogininfors;
}

/**
 * 系统访问日志情况信息 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysLogininforRepositoryImpl implements ISysLogininforRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectLogininforPage(
    query: ListQueryPageOptions
  ): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.ipaddr) {
      conditions.push("ipaddr like concat(?, '%')");
      params.push(query.ipaddr);
    }
    if (query.userName) {
      conditions.push("user_name like concat(?, '%')");
      params.push(query.userName);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      conditions.push('login_time >= ?');
      params.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      conditions.push('login_time <= ?');
      params.push(endDate);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_logininfor";
    const countRow: RowTotalType[] = await this.db.execute(
      totalSql + whereSql,
      params
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' order by info_id desc limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_LOGININFOR_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectLogininforList(
    sysLogininfor: SysLogininfor
  ): Promise<SysLogininfor[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysLogininfor.ipaddr) {
      conditions.push("ipaddr like concat(?, '%')");
      params.push(sysLogininfor.ipaddr);
    }
    if (sysLogininfor.userName) {
      conditions.push("user_name like concat(?, '%')");
      params.push(sysLogininfor.userName);
    }
    if (sysLogininfor.status) {
      conditions.push('status = ?');
      params.push(sysLogininfor.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_LOGININFOR_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async insertLogininfor(sysLogininfor: SysLogininfor): Promise<string> {
    const paramMap = new Map();
    paramMap.set('login_time', Date.now());
    if (sysLogininfor.userName) {
      paramMap.set('user_name', sysLogininfor.userName);
    }
    if (sysLogininfor.status) {
      paramMap.set('status', parseNumber(sysLogininfor.status));
    }
    if (sysLogininfor.ipaddr) {
      paramMap.set('ipaddr', sysLogininfor.ipaddr);
    }
    if (sysLogininfor.loginLocation) {
      paramMap.set('login_location', sysLogininfor.loginLocation);
    }
    if (sysLogininfor.browser) {
      paramMap.set('browser', sysLogininfor.browser);
    }

    if (sysLogininfor.os) {
      paramMap.set('os', sysLogininfor.os);
    }
    if (sysLogininfor.msg) {
      paramMap.set('msg', sysLogininfor.msg);
    }

    const sqlStr = `insert into sys_logininfor (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async deleteLogininforByIds(infoIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_logininfor where info_id in (${infoIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, infoIds);
    return result.affectedRows;
  }

  async cleanLogininfor(): Promise<number> {
    const sqlStr = 'truncate table sys_logininfor';
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.serverStatus;
  }
}
