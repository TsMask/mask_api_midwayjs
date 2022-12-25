import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../common/utils/DateFnsUtils';
import { parseNumber } from '../../../../common/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysOperLog } from '../../model/SysOperLog';
import { ISysOperLogRepository } from '../ISysOperLogRepository';

/**查询视图对象SQL */
const SELECT_OPER_LOG_VO = `select 
oper_id, title, business_type, method, request_method, operator_type, oper_name, dept_name, 
oper_url, oper_ip, oper_location, oper_param, json_result, status, error_msg, oper_time
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
SYS_OPER_LOG_RESULT.set('json_result', 'jsonResult');
SYS_OPER_LOG_RESULT.set('status', 'status');
SYS_OPER_LOG_RESULT.set('error_msg', 'errorMsg');
SYS_OPER_LOG_RESULT.set('oper_time', 'operTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysOperLogResult(rows: any[]): SysOperLog[] {
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
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysOperLogRepositoryImpl implements ISysOperLogRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectOperLogPage(query: any): Promise<rowPages> {
    // 查询条件拼接
    let sqlStr = '';
    const paramArr = [];
    if (query.title) {
      sqlStr += " and title like concat('%', ?, '%') ";
      paramArr.push(query.title);
    }
    if (query.businessType) {
      sqlStr += ' and business_type = ? ';
      paramArr.push(query.businessType);
    }
    if (query.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(query.status);
    }
    if (query.operName) {
      sqlStr += " and oper_name like concat('%', ?, '%') ";
      paramArr.push(query.operName);
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
      `select count(1) as 'total' from sys_oper_log where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' order by oper_id desc limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    let pageSize = parseNumber(query.pageSize);
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);
    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_OPER_LOG_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysOperLogResult(results);
    return { total, rows };
  }

  async selectOperLogList(sysOperLog: SysOperLog): Promise<SysOperLog[]> {
    let sqlStr = '';
    const paramArr = [];
    if (sysOperLog.title) {
      sqlStr += " and title like concat('%', ?, '%') ";
      paramArr.push(sysOperLog.title);
    }
    if (sysOperLog.businessType) {
      sqlStr += ' and business_type = ? ';
      paramArr.push(sysOperLog.businessType);
    }
    if (sysOperLog.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysOperLog.status);
    }
    if (sysOperLog.operName) {
      sqlStr += " and oper_name like concat('%', ?, '%') ";
      paramArr.push(sysOperLog.operName);
    }

    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_OPER_LOG_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    return parseSysOperLogResult(results);
  }

  async selectOperLogById(operId: string): Promise<SysOperLog> {
    const sqlStr = `${SELECT_OPER_LOG_VO} where oper_id = ? `;
    const rows = await this.db.execute(sqlStr, [operId]);
    return parseSysOperLogResult(rows)[0] || null;
  }

  async insertOperLog(sysOperLog: SysOperLog): Promise<string> {
    const paramMap = new Map();
    paramMap.set('oper_time', Date.now());
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
    if (sysOperLog.jsonResult) {
      paramMap.set('json_result', sysOperLog.jsonResult);
    }
    if (sysOperLog.status) {
      paramMap.set('status', parseNumber(sysOperLog.status));
    }
    if (sysOperLog.errorMsg) {
      paramMap.set('error_msg', sysOperLog.errorMsg);
    }

    const sqlStr = `insert into sys_oper_log (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async deleteOperLogByIds(operIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_oper_log where oper_id in (${operIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, operIds);
    return result.affectedRows;
  }

  async cleanOperLog(): Promise<number> {
    const sqlStr = 'truncate table sys_oper_log';
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.affectedRows;
  }
}
