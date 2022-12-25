import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../common/utils/DateFnsUtils';
import { parseNumber } from '../../../../common/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysLogininfor } from '../../model/SysLogininfor';
import { ISysLogininforRepository } from '../ISysLogininforRepository';

/**查询视图对象SQL */
const SELECT_LOGININFOR_VO = `select info_id, user_name, ipaddr, login_location, 
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
function parseSysLogininforResult(rows: any[]): SysLogininfor[] {
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
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysLogininforRepositoryImpl implements ISysLogininforRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectLogininforPage(query: any): Promise<rowPages> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (query.ipaddr) {
      sqlStr += " and ipaddr like concat('%', ?, '%') ";
      paramArr.push(query.ipaddr);
    }
    if (query.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(query.status);
    }
    if (query.userName) {
      sqlStr += " and user_name like concat('%', ?, '%') ";
      paramArr.push(query.userName);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      sqlStr += ' and oper_time >= ? ';
      paramArr.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      sqlStr += ' and oper_time <= ? ';
      paramArr.push(endDate);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: rowTotal[] = await this.db.execute(
      `select count(1) as 'total' from sys_logininfor where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' order by info_id desc limit ?,? ';
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
      `${SELECT_LOGININFOR_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysLogininforResult(results);
    return { total, rows };
  }

  async selectLogininforList(
    sysLogininfor: SysLogininfor
  ): Promise<SysLogininfor[]> {
    let sqlStr = '';
    const paramArr = [];
    if (sysLogininfor.ipaddr) {
      sqlStr += " and ipaddr like concat('%', ?, '%') ";
      paramArr.push(sysLogininfor.ipaddr);
    }
    if (sysLogininfor.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysLogininfor.status);
    }
    if (sysLogininfor.userName) {
      sqlStr += " and user_name like concat('%', ?, '%') ";
      paramArr.push(sysLogininfor.userName);
    }

    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_LOGININFOR_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    return parseSysLogininforResult(results);
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
    return result.affectedRows;
  }
}
