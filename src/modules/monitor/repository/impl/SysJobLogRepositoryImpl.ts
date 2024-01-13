import { Provide, Inject, Singleton } from '@midwayjs/core';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysJobLog } from '../../model/SysJobLog';
import { ISysJobLogRepository } from '../ISysJobLogRepository';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';
import { ResultSetHeader } from 'mysql2';

/**查询视图对象SQL */
const SELECT_JOB_LOG_SQL = `select job_log_id, job_name, job_group, invoke_target, 
target_params, job_msg, status, create_time, cost_time from sys_job_log`;

/**操作定时任务调度日志表信息实体映射 */
const SYS_JOB_LOG_RESULT = new Map<string, string>();
SYS_JOB_LOG_RESULT.set('job_log_id', 'jobLogId');
SYS_JOB_LOG_RESULT.set('job_name', 'jobName');
SYS_JOB_LOG_RESULT.set('job_group', 'jobGroup');
SYS_JOB_LOG_RESULT.set('invoke_target', 'invokeTarget');
SYS_JOB_LOG_RESULT.set('target_params', 'targetParams');
SYS_JOB_LOG_RESULT.set('job_msg', 'jobMsg');
SYS_JOB_LOG_RESULT.set('status', 'status');
SYS_JOB_LOG_RESULT.set('create_time', 'createTime');
SYS_JOB_LOG_RESULT.set('cost_time', 'costTime');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysJobLog[] {
  const sysJobLogs: SysJobLog[] = [];
  for (const row of rows) {
    const sysJobLog = new SysJobLog();
    for (const key in row) {
      if (SYS_JOB_LOG_RESULT.has(key)) {
        const keyMapper = SYS_JOB_LOG_RESULT.get(key);
        sysJobLog[keyMapper] = row[key];
      }
    }
    sysJobLogs.push(sysJobLog);
  }
  return sysJobLogs;
}

/**
 * 调度任务日志信息 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysJobLogRepositoryImpl implements ISysJobLogRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectJobLogPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.jobName) {
      conditions.push("job_name = ?");
      params.push(query.jobName);
    }
    if (query.jobGroup) {
      conditions.push('job_group = ?');
      params.push(query.jobGroup);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }
    if (query.invokeTarget) {
      conditions.push("invoke_target like concat(?, '%')");
      params.push(query.invokeTarget);
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
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_job_log";
    const countRow: RowTotalType[] = await this.db.execute(
      totalSql + whereSql,
      params
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }

    // 分页
    const pageSql = ' order by job_log_id desc limit ?,? ';
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    params.push(pageNum * pageSize);
    params.push(pageSize);

    // 查询数据
    const querySql = SELECT_JOB_LOG_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectJobLogList(sysJobLog: SysJobLog): Promise<SysJobLog[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysJobLog.jobName) {
      conditions.push("job_name like concat(?, '%')");
      params.push(sysJobLog.jobName);
    }
    if (sysJobLog.jobGroup) {
      conditions.push('job_group = ?');
      params.push(sysJobLog.jobGroup);
    }
    if (sysJobLog.status) {
      conditions.push('status = ?');
      params.push(sysJobLog.status);
    }
    if (sysJobLog.invokeTarget) {
      conditions.push("invoke_target like concat(?, '%')");
      params.push(sysJobLog.invokeTarget);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_JOB_LOG_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectJobLogById(jobLogId: string): Promise<SysJobLog> {
    const sqlStr = `${SELECT_JOB_LOG_SQL} where job_log_id = ? `;
    const rows = await this.db.execute(sqlStr, [jobLogId]);
    return convertResultRows(rows)[0] || null;
  }

  async insertJobLog(sysJobLog: SysJobLog): Promise<string> {
    const paramMap = new Map();
    paramMap.set('create_time', Date.now());
    if (sysJobLog.jobLogId) {
      paramMap.set('job_log_id', sysJobLog.jobLogId);
    }
    if (sysJobLog.jobName) {
      paramMap.set('job_name', sysJobLog.jobName);
    }
    if (sysJobLog.jobGroup) {
      paramMap.set('job_group', sysJobLog.jobGroup);
    }
    if (sysJobLog.invokeTarget) {
      paramMap.set('invoke_target', sysJobLog.invokeTarget);
    }
    if (sysJobLog.targetParams) {
      paramMap.set('target_params', sysJobLog.targetParams);
    }
    if (sysJobLog.jobMsg) {
      paramMap.set('job_msg', sysJobLog.jobMsg);
    }
    if (sysJobLog.status) {
      paramMap.set('status', parseNumber(sysJobLog.status));
    }
    if (sysJobLog.costTime) {
      paramMap.set('cost_time', parseNumber(sysJobLog.costTime));
    }

    const [keys, values, placeholder] =
      this.db.keyValuePlaceholderByInsert(paramMap);
    const sqlStr = `insert into sys_job_log (${keys})values(${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, values);
    return `${result.insertId}`;
  }

  async deleteJobLogByIds(jobLogIds: string[]): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(jobLogIds.length);
    const sqlStr = `delete from sys_job_log where job_log_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, jobLogIds);
    return result.affectedRows;
  }

  async cleanJobLog(): Promise<number> {
    const sqlStr = 'truncate table sys_job_log';
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.serverStatus;
  }
}
