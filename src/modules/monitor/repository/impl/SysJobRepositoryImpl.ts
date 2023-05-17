import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysJob } from '../../model/SysJob';
import { ISysJobRepository } from '../ISysJobRepository';

/**查询视图对象SQL */
const SELECT_JOB_VO = `select job_id, job_name, job_group, invoke_target, target_params, cron_expression, 
misfire_policy, concurrent, status, create_by, create_time, remark from sys_job`;

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
function parseSysJobResult(rows: any[]): SysJob[] {
  const sysJobs: SysJob[] = [];
  for (const row of rows) {
    const sysJob = new SysJob();
    for (const key in row) {
      if (SYS_JOB_RESULT.has(key)) {
        const keyMapper = SYS_JOB_RESULT.get(key);
        sysJob[keyMapper] = row[key];
      }
    }
    sysJobs.push(sysJob);
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

    // 查询条件数 长度必为0其值为0
    const countRow: RowTotalType[] = await this.db.execute(
      `select count(1) as 'total' from sys_job where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const total = parseNumber(countRow[0].total);
    if (total <= 0) {
      return { total: 0, rows: [] };
    }
    // 分页
    sqlStr += ' limit ?,? ';
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
      `${SELECT_JOB_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    const rows = parseSysJobResult(results);
    return { total, rows };
  }

  async selectJobList(sysJob: SysJob): Promise<SysJob[]> {
    let sqlStr = '';
    const paramArr = [];
    if (sysJob.jobName) {
      sqlStr += " and job_name like concat(?, '%') ";
      paramArr.push(sysJob.jobName);
    }
    if (sysJob.jobGroup) {
      sqlStr += ' and job_group = ? ';
      paramArr.push(sysJob.jobGroup);
    }
    if (sysJob.status) {
      sqlStr += ' and status = ? ';
      paramArr.push(sysJob.status);
    }
    if (sysJob.invokeTarget) {
      sqlStr += " and invoke_target like concat(?, '%') ";
      paramArr.push(sysJob.invokeTarget);
    }

    // 查询数据数
    const results = await this.db.execute(
      `${SELECT_JOB_VO} where 1 = 1 ${sqlStr}`,
      paramArr
    );
    return parseSysJobResult(results);
  }

  async selectJobByInvokeTarget(invokeTarget: string): Promise<SysJob> {
    const sqlStr = `${SELECT_JOB_VO} where invoke_target = ? `;
    const rows = await this.db.execute(sqlStr, [invokeTarget]);
    return parseSysJobResult(rows)[0] || null;
  }

  async selectJobById(jobId: string): Promise<SysJob> {
    const sqlStr = `${SELECT_JOB_VO} where job_id = ? `;
    const rows = await this.db.execute(sqlStr, [jobId]);
    return parseSysJobResult(rows)[0] || null;
  }

  async checkUniqueJob(jobName: string, jobGroup: string): Promise<string> {
    const sqlStr =
      "select job_id as 'str' from sys_job where job_name = ? and job_group = ? limit 1";
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, [
      jobName,
      jobGroup,
    ]);
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
    if (sysJob.remark) {
      paramMap.set('remark', sysJob.remark);
    }
    if (sysJob.createBy) {
      paramMap.set('create_by', sysJob.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_job (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
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
    if (sysJob.remark) {
      paramMap.set('remark', sysJob.remark);
    }
    if (sysJob.updateBy) {
      paramMap.set('update_by', sysJob.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const sqlStr = `update sys_job set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(',')} where job_id = ?`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysJob.jobId,
    ]);
    return result.affectedRows;
  }

  async deleteJobByIds(jobIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_job where job_id in (${jobIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, jobIds);
    return result.affectedRows;
  }
}
