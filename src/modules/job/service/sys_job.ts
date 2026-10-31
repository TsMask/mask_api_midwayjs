import { Provide, Inject, Singleton } from '@midwayjs/core';

import { SysJob } from '../model/sys_job';
import { SysJobLog } from '../model/sys_job_log';
import { SysJobRepository } from '../repository/sys_job';
import { SysJobLogRepository } from '../repository/sys_job_log';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../internal/shared/constants/common';
import { FileUtil } from '../../../internal/shared/file/file';
import { CronManager } from '../../../internal/infra/cron/cron';
import { CronJobState } from '../../../internal/infra/cron/job';
import type { JobLogRecord } from '../../../internal/infra/cron/log';
import { SysDictDataService } from '../../system/service/sys_dict_data';

/**调度任务 服务层处理 */
@Provide()
@Singleton()
export class SysJobService {
  /**调度任务数据信息 */
  @Inject()
  private sysJobRepository!: SysJobRepository;

  /**调度任务日志数据信息 */
  @Inject()
  private sysJobLogRepository!: SysJobLogRepository;

  /**字典类型服务 */
  @Inject()
  private sysDictTypeService!: SysDictDataService;

  /**定时任务管理器 */
  @Inject()
  private cronManager!: CronManager;

  /**文件服务 */
  @Inject()
  private fileUtil!: FileUtil;

  /**
   * 分页查询
   * @param query 分页查询
   * @returns 结果
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysJob[], number]> {
    return await this.sysJobRepository.selectByPage(query);
  }

  /**
   * 查询
   * @param query 分页查询
   * @returns 结果
   */
  public async find(sysJob: SysJob): Promise<SysJob[]> {
    return await this.sysJobRepository.select(sysJob);
  }

  /**
   * 通过ID查询
   * @param jobId
   * @returns
   */
  public async findById(jobId: number): Promise<SysJob> {
    if (jobId <= 0) {
      return new SysJob();
    }
    const jobs = await this.sysJobRepository.selectByIds([jobId]);
    if (jobs.length > 0) {
      return jobs[0];
    }
    return new SysJob();
  }

  /**
   * 新增
   * @param sysJob 信息
   * @returns ID
   */
  public async insert(sysJob: SysJob): Promise<number> {
    const insertId = await this.sysJobRepository.insert(sysJob);
    if (insertId && sysJob.jobStatus === STATUS_YES) {
      sysJob.id = insertId;
      await this.insertQueueJob(sysJob, true);
    }
    return insertId;
  }

  /**
   * 修改
   * @param sysJob 信息
   * @returns 影响记录数
   */
  public async update(sysJob: SysJob): Promise<number> {
    const rows = await this.sysJobRepository.update(sysJob);
    if (rows > 0) {
      // 更新时始终先移除旧的队列任务
      await this.deleteQueueJob(sysJob);
      // 状态正常时重新添加队列任务
      if (sysJob.jobStatus === STATUS_YES) {
        await this.insertQueueJob(sysJob, true);
      }
    }
    return rows;
  }

  /**
   * 批量删除
   * @param jobIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(jobIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const jobs = await this.sysJobRepository.selectByIds(jobIds);
    if (jobs.length <= 0) {
      return [0, '没有权限访问调度任务数据！'];
    }
    if (jobs.length === jobIds.length) {
      // 清除任务
      for (const job of jobs) {
        await this.deleteQueueJob(job);
      }
      const rows = await this.sysJobRepository.deleteByIds(jobIds);
      return [rows, ''];
    }
    return [0, '删除调度任务信息失败！'];
  }

  /**
   * 校验调度任务名称和组是否唯一
   * @param jobName 调度任务名称
   * @param jobGroup 调度任务组
   * @param jobId 调度任务ID
   * @returns true 唯一，false 不唯一
   */
  public async checkUniqueJobName(
    jobName: string,
    jobGroup: string,
    jobId: number
  ): Promise<boolean> {
    const sysJob = new SysJob();
    sysJob.jobName = jobName;
    sysJob.jobGroup = jobGroup;
    const uniqueId = await this.sysJobRepository.checkUnique(sysJob);
    if (uniqueId === jobId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 添加调度任务
   *
   * @param sysJob 调度任务信息
   * @param repeat 触发执行cron重复多次
   * @return 结果
   */
  private async insertQueueJob(
    sysJob: SysJob,
    repeat: boolean
  ): Promise<boolean> {
    const queue = this.cronManager.getQueue<SysJob>(sysJob.jobInvokeTarget);
    if (!queue) return false;
    const state = await queue.runJob(sysJob, {
      id: String(sysJob.id),
      cron: repeat ? sysJob.jobCron : undefined,
      concurrent: sysJob.jobConcurrent === '1',
    });
    return state === CronJobState.Waiting || state === CronJobState.Active;
  }

  /**
   * 删除调度任务
   * @param sysJob 信息
   * @returns 结果
   */
  private async deleteQueueJob(sysJob: SysJob): Promise<void> {
    await this.cronManager
      .getQueue<SysJob>(sysJob.jobInvokeTarget)
      ?.removeJob(String(sysJob.id));
  }

  /**
   * 日志记录保存
   * @param jld 日志记录数据
   * @param status 日志状态
   * @returns
   */
  public async saveJobLog(jld: JobLogRecord<SysJob>) {
    // 读取任务信息
    const sysJob = jld.data;

    // 任务日志不需要记录
    if (sysJob.jobSaveLog === '' || sysJob.jobSaveLog === STATUS_NO) {
      return;
    }

    // 结果信息key的Name
    let resultName = 'failed';
    if (jld.status === STATUS_YES) {
      resultName = 'completed';
    }

    // 结果信息序列化字符串
    let jobMsg = JSON.stringify({
      cron: sysJob.jobCron,
      invoke_target: sysJob.jobInvokeTarget,
      result: resultName,
      message: jld.result,
    });
    if (jobMsg.length >= 2048) {
      jobMsg = jobMsg.substring(0, 2048);
    }

    // 创建日志对象
    const now = Date.now().valueOf();
    const sysJobLog = new SysJobLog();
    sysJobLog.jobName = sysJob.jobName;
    sysJobLog.jobGroup = sysJob.jobGroup;
    sysJobLog.jobInvokeTarget = sysJob.jobInvokeTarget;
    sysJobLog.jobTargetParams = sysJob.jobTargetParams;
    sysJobLog.logStatus = jld.status;
    sysJobLog.logMsg = jobMsg;
    sysJobLog.logCostTime = now - jld.timestamp;
    sysJobLog.createTime = now;
    // 插入数据
    await this.sysJobLogRepository.insert(sysJobLog);
  }

  /**
   * 重置初始调度任务
   */
  public async reset(): Promise<void> {
    // 获取业务模块注册的队列列表
    const queueList = this.cronManager.queueNames();
    if (!queueList || queueList.length === 0) {
      return;
    }
    // 查询系统中定义状态为正常启用的任务
    const sysJob = new SysJob();
    sysJob.jobStatus = STATUS_YES;
    const sysJobs = await this.sysJobRepository.select(sysJob);
    for (const sysJob of sysJobs) {
      if (queueList.includes(sysJob.jobInvokeTarget)) {
        await this.insertQueueJob(sysJob, true);
      }
    }
  }

  /**
   * 立即运行一次调度任务
   * @param sysJob 信息
   * @returns 结果
   */
  public async run(sysJob: SysJob): Promise<boolean> {
    return await this.insertQueueJob(sysJob, false);
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysJob[], fileName: string) {
    // 读取任务组名字典数据
    const dictSysJobGroup =
      await this.sysDictTypeService.findByType('sys_job_group');
    // 第一行表头标题
    const data: string[][] = [
      [
        '任务编号',
        '任务名称',
        '任务组名',
        '调用目标',
        '传入参数',
        '执行表达式',
        '出错策略',
        '并发执行',
        '任务状态',
        '备注说明',
      ],
    ];
    for (const item of rows) {
      // 任务组名
      let sysJobGroup = '';
      for (const v of dictSysJobGroup) {
        if (item.jobGroup === v.dataValue) {
          sysJobGroup = v.dataLabel;
          break;
        }
      }
      let misfirePolicy = '放弃执行';
      if (item.jobMisfirePolicy === '1') {
        misfirePolicy = '立即执行';
      } else if (item.jobMisfirePolicy === '2') {
        misfirePolicy = '执行一次';
      }
      let concurrent = '禁止';
      if (item.jobConcurrent === '1') {
        concurrent = '允许';
      }
      // 状态
      let statusValue = '失败';
      if (item.jobStatus === '1') {
        statusValue = '成功';
      }
      data.push([
        `${item.id ?? 0}`,
        item.jobName ?? '',
        sysJobGroup,
        item.jobInvokeTarget ?? '',
        item.jobTargetParams ?? '',
        item.jobCron ?? '',
        misfirePolicy,
        concurrent,
        statusValue,
        item.remark ?? '',
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
  }
}
