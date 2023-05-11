import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysJobLog } from '../../model/SysJobLog';
import { ISysJobLogRepository } from '../ISysJobLogRepository';
import {
  parseStrToDate,
  YYYY_MM_DD,
} from '../../../../framework/utils/DateUtils';

/**查询视图对象SQL */
const SELECT_JOB_LOG_VO = `select 
job_log_id, job_name, job_group, invoke_target, target_params, job_msg, status, create_time 
from sys_job_log`;

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

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysJobLogResult(rows: any[]): SysJobLog[] {
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
    let sqlStr = '';
    const paramArr = [];
    if (query.jobName) {
      sqlStr += " and job_name like concat(?, '%') ";
      paramArr.push(query.jobName);
    }
    if (query.jobGroup) {
      sqlStr += ' and job_group = ? ';
      paramArr.push(query.jobGroup);
    }
    if (query.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(query.status);
    }
    if (query.invokeTarget) {
      sqlStr += " and invoke_target like concat(?, '%') ";
      paramArr.push(query.invokeTarget);
    }
    const beginTime = query.beginTime || query['params[beginTime]'];
    if (beginTime) {
      const beginDate = parseStrToDate(beginTime, YYYY_MM_DD).getTime();
      sqlStr += ' and create_time >= ? ';
      paramArr.push(beginDate);
    }
    const endTime = query.endTime || query['params[endTime]'];
    if (endTime) {
      const endDate = parseStrToDate(endTime, YYYY_MM_DD).getTime();
      sqlStr += ' and create_time <= ? ';
      paramArr.push(endDate);
    }

    // 查询条件数 长度必为0其值为0
    const countRow: RowTotalType[] = await this.db.execute(
      `select count(1) as 'total' from sys_job_log where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' order by job_log_id desc limit ?,? ';
    let pageNum = parseNumber(query.pageNum);
    pageNum = pageNum <= 5000 ? pageNum : 5000;
    pageNum = pageNum > 0 ? pageNum - 1 : 0;
    let pageSize = parseNumber(query.pageSize);
    pageSize = pageSize <= 50000 ? pageSize : 50000;
    pageSize = pageSize > 0 ? pageSize : 10;
    paramArr.push(pageNum * pageSize);
    paramArr.push(pageSize);
    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_JOB_LOG_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysJobLogResult(results);
    return { total, rows };
  }

  async selectJobLogList(sysJobLog: SysJobLog): Promise<SysJobLog[]> {
    let sqlStr = '';
    const paramArr = [];
    if (sysJobLog.jobName) {
      sqlStr += " and job_name like concat(?, '%') ";
      paramArr.push(sysJobLog.jobName);
    }
    if (sysJobLog.jobGroup) {
      sqlStr += ' and job_group = ? ';
      paramArr.push(sysJobLog.jobGroup);
    }
    if (sysJobLog.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysJobLog.status);
    }
    if (sysJobLog.invokeTarget) {
      sqlStr += " and invoke_target like concat(?, '%') ";
      paramArr.push(sysJobLog.invokeTarget);
    }

    // 查询数据数
    const results = await this.db.execute(
      `${SYS_JOB_LOG_RESULT} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    return parseSysJobLogResult(results);
  }

  async selectJobLogById(jobLogId: string): Promise<SysJobLog> {
    const sqlStr = `${SELECT_JOB_LOG_VO} where job_log_id = ? `;
    const rows = await this.db.execute(sqlStr, [jobLogId]);
    return parseSysJobLogResult(rows)[0] || null;
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

    const sqlStr = `insert into sys_job_log (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async deleteJobLogByIds(jobLogId: string[]): Promise<number> {
    const sqlStr = `delete from sys_job_log where job_log_id in (${jobLogId
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, jobLogId);
    return result.affectedRows;
  }

  async cleanJobLog(): Promise<number> {
    const sqlStr = 'truncate table sys_job_log';
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.serverStatus;
  }
}
