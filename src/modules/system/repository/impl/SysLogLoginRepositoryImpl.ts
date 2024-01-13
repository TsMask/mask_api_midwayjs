import { Provide, Inject, Singleton } from '@midwayjs/core';
import { ResultSetHeader } from 'mysql2';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysLogLogin } from '../../model/SysLogLogin';
import { ISysLogLoginRepository } from '../ISysLogLoginRepository';

/**查询视图对象SQL */
const SELECT_SysLogLogin_SQL = `select login_id, user_name, ipaddr, login_location, 
browser, os, status, msg, login_time from sys_log_login`;

/**系统访问记录表信息实体映射 */
const SYS_SysLogLogin_RESULT = new Map<string, string>();
SYS_SysLogLogin_RESULT.set('login_id', 'loginId');
SYS_SysLogLogin_RESULT.set('user_name', 'userName');
SYS_SysLogLogin_RESULT.set('status', 'status');
SYS_SysLogLogin_RESULT.set('ipaddr', 'ipaddr');
SYS_SysLogLogin_RESULT.set('login_location', 'loginLocation');
SYS_SysLogLogin_RESULT.set('browser', 'browser');
SYS_SysLogLogin_RESULT.set('os', 'os');
SYS_SysLogLogin_RESULT.set('msg', 'msg');
SYS_SysLogLogin_RESULT.set('login_time', 'loginTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysLogLogin[] {
  const sysLogLogins: SysLogLogin[] = [];
  for (const row of rows) {
    const sysLogLogin = new SysLogLogin();
    for (const key in row) {
      if (SYS_SysLogLogin_RESULT.has(key)) {
        const keyMapper = SYS_SysLogLogin_RESULT.get(key);
        sysLogLogin[keyMapper] = row[key];
      }
    }
    sysLogLogins.push(sysLogLogin);
  }
  return sysLogLogins;
}

/**
 * 系统访问日志情况信息 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysLogLoginRepositoryImpl implements ISysLogLoginRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectSysLogLoginPage(
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
    const totalSql = "select count(1) as 'total' from sys_log_login";
    const countRow: RowTotalType[] = await this.db.execute(
      totalSql + whereSql,
      params
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' order by login_id desc limit ?,? ';
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_SysLogLogin_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectSysLogLoginList(
    SysLogLogin: SysLogLogin
  ): Promise<SysLogLogin[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (SysLogLogin.ipaddr) {
      conditions.push("ipaddr like concat(?, '%')");
      params.push(SysLogLogin.ipaddr);
    }
    if (SysLogLogin.userName) {
      conditions.push("user_name like concat(?, '%')");
      params.push(SysLogLogin.userName);
    }
    if (SysLogLogin.status) {
      conditions.push('status = ?');
      params.push(SysLogLogin.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_SysLogLogin_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async insertSysLogLogin(SysLogLogin: SysLogLogin): Promise<string> {
    const paramMap = new Map();
    paramMap.set('login_time', Date.now());
    if (SysLogLogin.userName) {
      paramMap.set('user_name', SysLogLogin.userName);
    }
    if (SysLogLogin.status) {
      paramMap.set('status', parseNumber(SysLogLogin.status));
    }
    if (SysLogLogin.ipaddr) {
      paramMap.set('ipaddr', SysLogLogin.ipaddr);
    }
    if (SysLogLogin.loginLocation) {
      paramMap.set('login_location', SysLogLogin.loginLocation);
    }
    if (SysLogLogin.browser) {
      paramMap.set('browser', SysLogLogin.browser);
    }

    if (SysLogLogin.os) {
      paramMap.set('os', SysLogLogin.os);
    }
    if (SysLogLogin.msg) {
      paramMap.set('msg', SysLogLogin.msg);
    }

    const [keys, values, placeholder] =
      this.db.keyValuePlaceholderByInsert(paramMap);
    const sqlStr = `insert into sys_log_login (${keys})values(${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, values);
    return `${result.insertId}`;
  }

  async deleteSysLogLoginByIds(loginIds: string[]): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(loginIds.length);
    const sqlStr = `delete from sys_log_login where login_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, loginIds);
    return result.affectedRows;
  }

  async cleanSysLogLogin(): Promise<number> {
    const sqlStr = 'truncate table sys_log_login';
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.serverStatus;
  }
}
