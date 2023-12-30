import { Provide, Inject, Singleton } from '@midwayjs/core';
import { ResultSetHeader } from 'mysql2';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysLogOperate } from '../../model/SysLogOperate';
import { ISysLogOperateRepository } from '../ISysLogOperateRepository';

/**查询视图对象SQL */
const SELECT_OPER_LOG_SQL = `select 
oper_id, title, business_type, method, request_method, operator_type, oper_name, dept_name, 
oper_url, oper_ip, oper_location, oper_param, oper_msg, status, oper_time, cost_time
from sys_log_operate`;

/**操作日志表信息实体映射 */
const SYS_OPER_LOG_RESULT = new Map<string, string>();
SYS_OPER_LOG_RESULT.set('oper_id', 'operId');
SYS_OPER_LOG_RESULT.set('title', 'title');
SYS_OPER_LOG_RESULT.set('business_type', 'businessType');
SYS_OPER_LOG_RESULT.set('method', 'method');
SYS_OPER_LOG_RESULT.set('request_method', 'requestMethod');
SYS_OPER_LOG_RESULT.set('operator_type', 'operatorType');
SYS_OPER_LOG_RESULT.set('oper_name', 'operName');
SYS_OPER_LOG_RESULT.set('dept_name', 'deptName');
SYS_OPER_LOG_RESULT.set('oper_url', 'operUrl');
SYS_OPER_LOG_RESULT.set('oper_ip', 'operIp');
SYS_OPER_LOG_RESULT.set('oper_location', 'operLocation');
SYS_OPER_LOG_RESULT.set('oper_param', 'operParam');
SYS_OPER_LOG_RESULT.set('oper_msg', 'operMsg');
SYS_OPER_LOG_RESULT.set('status', 'status');
SYS_OPER_LOG_RESULT.set('oper_time', 'operTime');
SYS_OPER_LOG_RESULT.set('cost_time', 'costTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysLogOperate[] {
  const sysLogOperates: SysLogOperate[] = [];
  for (const row of rows) {
    const sysLogOperate = new SysLogOperate();
    for (const key in row) {
      if (SYS_OPER_LOG_RESULT.has(key)) {
        const keyMapper = SYS_OPER_LOG_RESULT.get(key);
        sysLogOperate[keyMapper] = row[key];
      }
    }
    sysLogOperates.push(sysLogOperate);
  }
  return sysLogOperates;
}

/**
 * 操作日志 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysLogOperateRepositoryImpl implements ISysLogOperateRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectSysLogOperatePage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.title) {
      conditions.push("title like concat(?, '%')");
      params.push(query.title);
    }
    if (query.businessType) {
      conditions.push('business_type = ?');
      params.push(query.businessType);
    }
    if (query.operName) {
      conditions.push("oper_name like concat(?, '%')");
      params.push(query.operName);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      conditions.push('oper_time >= ?');
      params.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      conditions.push('oper_time <= ?');
      params.push(endDate);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_log_operate";
    const countRow: RowTotalType[] = await this.db.execute(
      totalSql + whereSql,
      params
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' order by oper_id desc limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据数据
    const querySql = SELECT_OPER_LOG_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectSysLogOperateList(SysLogOperate: SysLogOperate): Promise<SysLogOperate[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (SysLogOperate.title) {
      conditions.push("title like concat(?, '%')");
      params.push(SysLogOperate.title);
    }
    if (SysLogOperate.businessType) {
      conditions.push('business_type = ?');
      params.push(SysLogOperate.businessType);
    }
    if (SysLogOperate.operName) {
      conditions.push("oper_name like concat(?, '%')");
      params.push(SysLogOperate.operName);
    }
    if (SysLogOperate.status) {
      conditions.push('status = ?');
      params.push(SysLogOperate.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_OPER_LOG_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectSysLogOperateById(operId: string): Promise<SysLogOperate> {
    const sqlStr = `${SELECT_OPER_LOG_SQL} where oper_id = ? `;
    const rows = await this.db.execute(sqlStr, [operId]);
    return convertResultRows(rows)[0] || null;
  }

  async insertSysLogOperate(SysLogOperate: SysLogOperate): Promise<string> {
    const paramMap = new Map();
    if (SysLogOperate.title) {
      paramMap.set('title', SysLogOperate.title);
    }
    if (SysLogOperate.businessType) {
      paramMap.set('business_type', parseNumber(SysLogOperate.businessType));
    }
    if (SysLogOperate.method) {
      paramMap.set('method', SysLogOperate.method);
    }
    if (SysLogOperate.requestMethod) {
      paramMap.set('request_method', SysLogOperate.requestMethod);
    }
    if (SysLogOperate.operatorType) {
      paramMap.set('operator_type', parseNumber(SysLogOperate.operatorType));
    }
    if (SysLogOperate.deptName) {
      paramMap.set('dept_name', SysLogOperate.deptName);
    }
    if (SysLogOperate.operName) {
      paramMap.set('oper_name', SysLogOperate.operName);
    }
    if (SysLogOperate.operUrl) {
      paramMap.set('oper_url', SysLogOperate.operUrl);
    }
    if (SysLogOperate.operIp) {
      paramMap.set('oper_ip', SysLogOperate.operIp);
    }
    if (SysLogOperate.operLocation) {
      paramMap.set('oper_location', SysLogOperate.operLocation);
    }
    if (SysLogOperate.operParam) {
      paramMap.set('oper_param', SysLogOperate.operParam);
    }
    if (SysLogOperate.operMsg) {
      paramMap.set('oper_msg', SysLogOperate.operMsg);
    }
    if (SysLogOperate.status) {
      paramMap.set('status', parseNumber(SysLogOperate.status));
    }
    if (SysLogOperate.costTime) {
      paramMap.set('cost_time', parseNumber(SysLogOperate.costTime));
    }
    paramMap.set('oper_time', Date.now());

    const sqlStr = `insert into sys_log_operate (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async deleteSysLogOperateByIds(operIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_log_operate where oper_id in (${operIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, operIds);
    return result.affectedRows;
  }

  async cleanSysLogOperate(): Promise<number> {
    const sqlStr = 'truncate table sys_log_operate';
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.serverStatus;
  }
}
