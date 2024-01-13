import { Provide, Inject, Singleton } from '@midwayjs/core';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysJob } from '../../model/SysJob';
import { ISysJobRepository } from '../ISysJobRepository';
import { ResultSetHeader } from 'mysql2';

/**查询视图对象SQL */
const SELECT_JOB_SQL = `select job_id, job_name, job_group, invoke_target, target_params, cron_expression, 
misfire_policy, concurrent, status, save_log, create_by, create_time, remark from sys_job`;

/**操作定时任务调度表信息实体映射 */
const SYS_JOB_RESULT = new Map<string, string>();
SYS_JOB_RESULT.set('job_id', 'jobId');
SYS_JOB_RESULT.set('job_name', 'jobName');
SYS_JOB_RESULT.set('job_group', 'jobGroup');
SYS_JOB_RESULT.set('invoke_target', 'invokeTarget');
SYS_JOB_RESULT.set('target_params', 'targetParams');
SYS_JOB_RESULT.set('cron_expression', 'cronExpression');
SYS_JOB_RESULT.set('misfire_policy', 'misfirePolicy');
SYS_JOB_RESULT.set('concurrent', 'concurrent');
SYS_JOB_RESULT.set('status', 'status');
SYS_JOB_RESULT.set('save_log', 'saveLog');
SYS_JOB_RESULT.set('create_by', 'createBy');
SYS_JOB_RESULT.set('create_time', 'createTime');
SYS_JOB_RESULT.set('update_by', 'updateBy');
SYS_JOB_RESULT.set('update_time', 'updateTime');
SYS_JOB_RESULT.set('remark', 'remark');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function convertResultRows(rows: any[]): SysJob[] {
  const sysJobs: SysJob[] = [];
  for (const row of rows) {
    const item = new SysJob();
    for (const key in row) {
      if (SYS_JOB_RESULT.has(key)) {
        const keyMapper = SYS_JOB_RESULT.get(key);
        item[keyMapper] = row[key];
      }
    }
    sysJobs.push(item);
  }
  return sysJobs;
}

/**
 * 调度任务信息 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysJobRepositoryImpl implements ISysJobRepository {
  @Inject()
  private db: DynamicDataSource;

  async selectJobPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (query.jobName) {
      conditions.push("job_name like concat(?, '%')");
      params.push(query.jobName);
    }
    if (query.jobGroup) {
      conditions.push('job_group = ?');
      params.push(query.jobGroup);
    }
    if (query.invokeTarget) {
      conditions.push("invoke_target like concat(?, '%')");
      params.push(query.invokeTarget);
    }
    if (query.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数量 长度为0直接返回
    const totalSql = "select count(1) as 'total' from sys_job";
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
    const querySql = SELECT_JOB_SQL + whereSql + pageSql;
    const results = await this.db.execute(querySql, params);
    const rows = convertResultRows(results);
    return { total, rows };
  }

  async selectJobList(sysJob: SysJob): Promise<SysJob[]> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysJob.jobName) {
      conditions.push("job_name like concat(?, '%')");
      params.push(sysJob.jobName);
    }
    if (sysJob.jobGroup) {
      conditions.push('job_group = ?');
      params.push(sysJob.jobGroup);
    }
    if (sysJob.invokeTarget) {
      conditions.push("invoke_target like concat(?, '%')");
      params.push(sysJob.invokeTarget);
    }
    if (sysJob.status) {
      conditions.push('status = ?');
      params.push(sysJob.status);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    }

    // 查询数据
    const querySql = SELECT_JOB_SQL + whereSql;
    const results = await this.db.execute(querySql, params);
    return convertResultRows(results);
  }

  async selectJobByIds(jobIds: string[]): Promise<SysJob[]> {
    const placeholder = this.db.keyPlaceholderByQuery(jobIds.length);
    const sqlStr = `${SELECT_JOB_SQL} where job_id in (${placeholder})`;
    const rows = await this.db.execute(sqlStr, jobIds);
    return convertResultRows(rows);
  }

  async checkUniqueJob(sysJob: SysJob): Promise<string> {
    // 查询条件拼接
    const conditions: string[] = [];
    const params: any[] = [];
    if (sysJob.jobName) {
      conditions.push('job_name = ?');
      params.push(sysJob.jobName);
    }
    if (sysJob.jobGroup) {
      conditions.push('job_group = ?');
      params.push(sysJob.jobGroup);
    }

    // 构建查询条件语句
    let whereSql = '';
    if (conditions.length > 0) {
      whereSql = ' where ' + conditions.join(' and ');
    } else {
      return null;
    }

    const sqlStr =
      "select job_id as 'str' from sys_job " + whereSql + ' limit 1';
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, params);
    return rows.length > 0 ? rows[0].str : null;
  }

  async insertJob(sysJob: SysJob): Promise<string> {
    const paramMap = new Map();
    if (sysJob.jobId) {
      paramMap.set('job_id', sysJob.jobId);
    }
    if (sysJob.jobName) {
      paramMap.set('job_name', sysJob.jobName);
    }
    if (sysJob.jobGroup) {
      paramMap.set('job_group', sysJob.jobGroup);
    }
    if (sysJob.invokeTarget) {
      paramMap.set('invoke_target', sysJob.invokeTarget);
    }
    if (sysJob.targetParams) {
      paramMap.set('target_params', sysJob.targetParams);
    }
    if (sysJob.cronExpression) {
      paramMap.set('cron_expression', sysJob.cronExpression);
    }
    if (sysJob.misfirePolicy) {
      paramMap.set('misfire_policy', parseNumber(sysJob.misfirePolicy));
    }
    if (sysJob.concurrent) {
      paramMap.set('concurrent', parseNumber(sysJob.concurrent));
    }
    if (sysJob.status) {
      paramMap.set('status', parseNumber(sysJob.status));
    }
    if (sysJob.saveLog) {
      paramMap.set('save_log', parseNumber(sysJob.saveLog));
    }
    if (sysJob.remark) {
      paramMap.set('remark', sysJob.remark);
    }
    if (sysJob.createBy) {
      paramMap.set('create_by', sysJob.createBy);
      paramMap.set('create_time', Date.now());
    }

    const [keys, values, placeholder] =
      this.db.keyValuePlaceholderByInsert(paramMap);
    const sqlStr = `insert into sys_job (${keys})values(${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, values);
    return `${result.insertId}`;
  }

  async updateJob(sysJob: SysJob): Promise<number> {
    const paramMap = new Map();
    if (sysJob.jobName) {
      paramMap.set('job_name', sysJob.jobName);
    }
    if (sysJob.jobGroup) {
      paramMap.set('job_group', sysJob.jobGroup);
    }
    if (sysJob.invokeTarget) {
      paramMap.set('invoke_target', sysJob.invokeTarget);
    }
    paramMap.set('target_params', sysJob.targetParams || '');
    if (sysJob.cronExpression) {
      paramMap.set('cron_expression', sysJob.cronExpression);
    }
    if (sysJob.misfirePolicy) {
      paramMap.set('misfire_policy', parseNumber(sysJob.misfirePolicy));
    }
    if (sysJob.concurrent) {
      paramMap.set('concurrent', parseNumber(sysJob.concurrent));
    }
    if (sysJob.status) {
      paramMap.set('status', parseNumber(sysJob.status));
    }
    if (sysJob.saveLog) {
      paramMap.set('save_log', parseNumber(sysJob.saveLog));
    }
    paramMap.set('remark', sysJob.remark || '');
    if (sysJob.updateBy) {
      paramMap.set('update_by', sysJob.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const [keys, values] = this.db.keyValueByUpdate(paramMap);
    const sqlStr = `update sys_job set ${keys} where job_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...values,
      sysJob.jobId,
    ]);
    return result.affectedRows;
  }

  async deleteJobByIds(jobIds: string[]): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(jobIds.length);
    const sqlStr = `delete from sys_job where job_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, jobIds);
    return result.affectedRows;
  }
}
