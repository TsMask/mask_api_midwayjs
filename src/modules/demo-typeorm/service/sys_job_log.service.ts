import { Provide, Singleton } from '@midwayjs/decorator';
import { SysJobLog } from '../model/sys_job_log.entity';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';

/**
 * 定时任务调度日志信息
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysJobLogService {
  @InjectEntityModel(SysJobLog)
  sysJobLogModel: Repository<SysJobLog>;

  /**
   * 分页查询调度任务日志集合
   *
   * @param query 查询信息
   * @return 操作日志集合
   */
  async selectJobLogPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    let { pageSize, pageNum, jobName } = query;
    let where: any = {};
    if (jobName) {
      where.jobName = jobName;
    }
    const [rows, total] = await this.sysJobLogModel.findAndCount({
      where,
      take: pageSize,
      skip: (pageNum - 1) * pageSize,
    });
    return { total, rows };
  }

  /**
   * 查询调度任务日志集合
   *
   * @param sysJobLog 调度任务日志信息
   * @return 调度任务列表
   */
  async selectJobLogList(sysJobLog: SysJobLog): Promise<SysJobLog[]> {
    let where: any = {};
    if (sysJobLog.jobName) {
      where.jobName = sysJobLog.jobName;
    }
    return await this.sysJobLogModel.findBy(where);
  }

  /**
   * 通过调度ID查询调度任务日志信息
   *
   * @param jobLogId 调度任务日志ID
   * @return 调度任务日志信息
   */
  async selectJobLogById(jobLogId: string): Promise<SysJobLog> {
    return await this.sysJobLogModel.findOne({
      where: {
        jobLogId: jobLogId,
      },
    });
  }

  /**
   * 新增调度任务日志信息
   *
   * @param sysJobLog 调度任务日志信息
   * @return 调度任务日志ID
   */
  async insertJobLog(sysJobLog: SysJobLog): Promise<string> {
    const result = await this.sysJobLogModel.save(sysJobLog);
    return result.jobLogId;
  }

  /**
   * 更新调度任务日志信息
   *
   * @param sysJobLog 调度任务日志信息
   * @return 调度任务日志ID
   */
  async updateJobLog(sysJobLog: SysJobLog): Promise<string> {
    const jobLog = await this.sysJobLogModel.findOne({
      where: {
        jobLogId: sysJobLog.jobLogId,
      },
    });
    if (!jobLog) return null;
    jobLog.jobName = sysJobLog.jobName;
    const result = await this.sysJobLogModel.save(jobLog);
    return result.jobLogId;
  }

  /**
   * 批量删除调度任务日志信息
   *
   * @param jobLogId 需要删除的调度任务日志ID
   * @return 删除记录数
   */
  async deleteJobLogByIds(jobLogIds: string[]): Promise<number> {
    const { affected } = await this.sysJobLogModel.delete(jobLogIds);
    return affected || 0;
  }

  /**
   * 清空调度任务日志
   * @return 删除记录数
   */
  async cleanJobLog(): Promise<number> {
    const rows = await this.sysJobLogModel.count();
    await this.sysJobLogModel.clear();
    return rows;
  }
}
