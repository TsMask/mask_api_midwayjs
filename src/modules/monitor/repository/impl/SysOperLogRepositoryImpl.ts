import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysOperLog } from '../../model/SysOperLog';
import { ISysOperLogRepository } from '../ISysOperLogRepository';

/**查询视图对象SQL */
const SELECT_OPER_LOG_SQL = `select 
oper_id, title, business_type, method, request_method, operator_type, oper_name, dept_name, 
oper_url, oper_ip, oper_location, oper_param, oper_msg, status, oper_time, cost_time
from sys_oper_log`;

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
function convertResultRows(rows: any[]): SysOperLog[] {
  const sysOperLogs: SysOperLog[] = [];
  for (const row of rows) {
    const sysOperLog = new SysOperLog();
    for (const key in row) {
      if (SYS_OPER_LOG_RESULT.has(key)) {
        const keyMapper = SYS_OPER_LOG_RESULT.get(key);
        sysOperLog[keyMapper] = row[key];
      }
    }
    sysOperLogs.push(sysOperLog);
  }
  return sysOperLogs;
}

/**
 * 操作日志 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysOperLogRepositoryImpl implements ISysOperLogRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectOperLogPage(query: ListQueryPageOptions): Promise<RowPagesType> {
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
    const totalSql = "select count(1) as 'total' from sys_oper_log";
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

  async selectOperLogList(sysOperLog: SysOperLog): Promise<SysOperLog[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysOperLog.title) {
      conditions.push("title like concat(?, '%')");
      params.push(sysOperLog.title);
    }
    if (sysOperLog.businessType) {
      conditions.push('business_type = ?');
      params.push(sysOperLog.businessType);
    }
    if (sysOperLog.operName) {
      conditions.push("oper_name like concat(?, '%')");
      params.push(sysOperLog.operName);
    }
    if (sysOperLog.status) {
      conditions.push('status = ?');
      params.push(sysOperLog.status);
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

  async selectOperLogById(operId: string): Promise<SysOperLog> {
    const sqlStr = `${SELECT_OPER_LOG_SQL} where oper_id = ? `;
    const rows = await this.db.execute(sqlStr, [operId]);
    return convertResultRows(rows)[0] || null;
  }

  async insertOperLog(sysOperLog: SysOperLog): Promise<string> {
    const paramMap = new Map();
    if (sysOperLog.title) {
      paramMap.set('title', sysOperLog.title);
    }
    if (sysOperLog.businessType) {
      paramMap.set('business_type', parseNumber(sysOperLog.businessType));
    }
    if (sysOperLog.method) {
      paramMap.set('method', sysOperLog.method);
    }
    if (sysOperLog.requestMethod) {
      paramMap.set('request_method', sysOperLog.requestMethod);
    }
    if (sysOperLog.operatorType) {
      paramMap.set('operator_type', parseNumber(sysOperLog.operatorType));
    }
    if (sysOperLog.deptName) {
      paramMap.set('dept_name', sysOperLog.deptName);
    }
    if (sysOperLog.operName) {
      paramMap.set('oper_name', sysOperLog.operName);
    }
    if (sysOperLog.operUrl) {
      paramMap.set('oper_url', sysOperLog.operUrl);
    }
    if (sysOperLog.operIp) {
      paramMap.set('oper_ip', sysOperLog.operIp);
    }
    if (sysOperLog.operLocation) {
      paramMap.set('oper_location', sysOperLog.operLocation);
    }
    if (sysOperLog.operParam) {
      paramMap.set('oper_param', sysOperLog.operParam);
    }
    if (sysOperLog.operMsg) {
      paramMap.set('oper_msg', sysOperLog.operMsg);
    }
    if (sysOperLog.status) {
      paramMap.set('status', parseNumber(sysOperLog.status));
    }
    if (sysOperLog.costTime) {
      paramMap.set('cost_time', parseNumber(sysOperLog.costTime));
    }
    paramMap.set('oper_time', Date.now());

    const sqlStr = `insert into sys_oper_log (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result = await this.db.execute(sqlStr, [...paramMap.values()]);
    return `${result.insertId}`;
  }

  async deleteOperLogByIds(operIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_oper_log where oper_id in (${operIds
      .map(() => '?')
      .join(',')})`;
    const result = await this.db.execute(sqlStr, operIds);
    return result.affectedRows;
  }

  async cleanOperLog(): Promise<number> {
    const sqlStr = 'truncate table sys_oper_log';
    const result = await this.db.execute(sqlStr);
    return result.serverStatus;
  }
}
