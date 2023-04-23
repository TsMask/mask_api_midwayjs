import { Job } from '@midwayjs/bull';
import { BullFramework } from '@midwayjs/bull/dist/framework';
import { Provide, Inject, ScopeEnum, Scope, Init } from '@midwayjs/decorator';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../../framework/constants/CommonConstants';
import { SysJob } from '../../model/SysJob';
import { SysJobLog } from '../../model/SysJobLog';
import { SysJobLogRepositoryImpl } from '../../repository/impl/SysJobLogRepositoryImpl';
import { SysJobRepositoryImpl } from '../../repository/impl/SysJobRepositoryImpl';
import { ISysJobService } from '../ISysJobService';

/**
 * 定时任务调度信息 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysJobServiceImpl implements ISysJobService {
  @Inject()
  private bullFramework: BullFramework;

  @Inject()
  private sysJobRepository: SysJobRepositoryImpl;

  @Inject()
  private sysJobLogRepository: SysJobLogRepositoryImpl;

  @Init()
  async init() {
    // 启动时，初始化调度任务
    await this.resetQueueJob();
  }

  async selectJobPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysJobRepository.selectJobPage(query);
  }
  async selectJobList(sysJob: SysJob): Promise<SysJob[]> {
    return await this.sysJobRepository.selectJobList(sysJob);
  }
  async selectJobById(jobId: string): Promise<SysJob> {
    return await this.sysJobRepository.selectJobById(jobId);
  }

  async checkUniqueJob(sysJob: SysJob): Promise<boolean> {
    const jobId = await this.sysJobRepository.checkUniqueJob(
      sysJob.jobName,
      sysJob.jobGroup
    );
    // 任务数据与查询得到任务id一致
    if (jobId && sysJob.jobId === jobId) {
      return true;
    }
    return !jobId;
  }

  async insertJob(sysJob: SysJob): Promise<string> {
    const insertId = await this.sysJobRepository.insertJob(sysJob);
    if (insertId && sysJob.status === STATUS_YES) {
      sysJob.jobId = insertId;
      await this.insertQueueJob(sysJob, true);
    }
    return insertId;
  }

  async updateJob(sysJob: SysJob): Promise<number> {
    const rows = await this.sysJobRepository.updateJob(sysJob);
    if (rows > 0) {
      const status = sysJob.status;
      // 状态正常添加队列任务
      if (status === STATUS_YES) {
        await this.insertQueueJob(sysJob, true);
      }
      // 状态禁用删除队列任务
      if (status === STATUS_NO) {
        await this.deleteQueueJob(sysJob);
      }
    }
    return rows;
  }

  async deleteJobByIds(jobIds: string[]): Promise<number> {
    for (const jobId of jobIds) {
      // 检查是否存在
      const sysJob = await this.sysJobRepository.selectJobById(jobId);
      if (!sysJob) continue;
      await this.deleteQueueJob(sysJob);
    }
    return await this.sysJobRepository.deleteJobByIds(jobIds);
  }

  async changeStatus(sysJob: SysJob): Promise<boolean> {
    const status = sysJob.status;
    // 状态正常添加队列任务
    if (status === STATUS_YES) {
      await this.insertQueueJob(sysJob, true);
    }
    // 状态禁用删除队列任务
    if (status === STATUS_NO) {
      await this.deleteQueueJob(sysJob);
    }
    // 更新状态
    const newSysJob = new SysJob();
    newSysJob.jobId = sysJob.jobId;
    newSysJob.status = status;
    newSysJob.updateBy = sysJob.updateBy;
    return (await this.sysJobRepository.updateJob(newSysJob)) > 0;
  }

  async insertQueueJob(sysJob: SysJob, repeat: boolean): Promise<boolean> {
    // 获取队列 Processor
    const queue = this.bullFramework.getQueue(sysJob.invokeTarget);
    if (!queue) return;

    const jobId = sysJob.jobId;
    const cron = sysJob.cronExpression;
    const jobName = sysJob.jobName;
    const jobGroup = sysJob.jobGroup;
    const invokeTarget = sysJob.invokeTarget;
    const targetParams = sysJob.targetParams;

    // 移除全部监听
    queue.removeAllListeners();
    // 添加完成监听
    queue.addListener('completed', async (job: Job, result: ProcessorData) => {
      // 记录调度日志
      const sysJobLog = new SysJobLog().new(
        jobName,
        jobGroup,
        invokeTarget,
        targetParams,
        STATUS_YES,
        JSON.stringify(result).substring(0, 500)
      );
      await this.sysJobLogRepository.insertJobLog(sysJobLog);
      await job.remove();
    });
    // 添加失败监听
    queue.addListener('failed', async (job: Job, error: Error) => {
      const errorStr = JSON.stringify({
        name: error.name,
        message: error.message,
      });
      // 记录调度日志
      const sysJobLog = new SysJobLog().new(
        jobName,
        jobGroup,
        invokeTarget,
        targetParams,
        STATUS_NO,
        errorStr.substring(0, 500)
      );
      await this.sysJobLogRepository.insertJobLog(sysJobLog);
      await job.remove();
    });

    // 重复任务cron
    if (repeat) {
      // 移除重复任务，在执行中的无法移除
      const repeatableJobs = await queue.getRepeatableJobs();
      for (const repeatable of repeatableJobs) {
        if (jobId === repeatable.id) {
          await queue.removeRepeatableByKey(repeatable.key);
        }
      }
      // 清除任务记录
      await queue.clean(5000, 'active');
      await queue.clean(5000, 'wait');

      // 添加重复任务
      await queue.runJob(
        {
          jobId: jobId,
          cron: cron,
          params: targetParams,
        },
        {
          jobId: jobId,
          repeat: {
            cron: cron,
          },
        }
      );
      return true;
    }

    // 判断是否有单次执行任务
    let job = await queue.getJob(jobId);
    if (job) {
      // 进行中的拒绝执行，其他状态移除
      const isActive = await job.isActive();
      if (isActive) return false;
      await job.remove();
    }
    // 执行单次任务
    job = await queue.runJob(
      {
        jobId: jobId,
        params: targetParams,
      },
      { jobId: jobId }
    );
    // 执行中或等待中的都返回正常
    const isActive = await job.isActive();
    const isWaiting = await job.isWaiting();
    return isActive || isWaiting;
  }

  async deleteQueueJob(sysJob: SysJob): Promise<void> {
    // 获取队列 Processor
    const queue = this.bullFramework.getQueue(sysJob.invokeTarget);
    if (!queue) return;

    const jobId = sysJob.jobId;

    // 移除重复任务，在执行中的无法移除
    const repeatableJobs = await queue.getRepeatableJobs();
    for (const repeatable of repeatableJobs) {
      if (jobId === repeatable.id) {
        await queue.removeRepeatableByKey(repeatable.key);
      }
    }
    // 清除任务记录
    await queue.clean(5000, 'active');
    await queue.clean(5000, 'wait');
  }

  async runQueueJob(sysJob: SysJob): Promise<boolean> {
    return await this.insertQueueJob(sysJob, false);
  }

  async resetQueueJob(): Promise<void> {
    // 查询系统中定义状态为正常启用的任务
    const sysJob = new SysJob();
    sysJob.status = STATUS_YES;
    const sysJobs = await this.sysJobRepository.selectJobList(sysJob);
    if (sysJobs && sysJobs.length > 0) {
      // 获取bull上注册的队列列表
      const queueList = this.bullFramework.getQueueList();
      if (queueList && queueList.length > 0) {
        for (const queue of queueList) {
          // 查询调度任务, 不是系统中定义不初始化
          const job = sysJobs.find(
            job => job.invokeTarget === queue.getQueueName()
          );
          if (job) {
            await this.insertQueueJob(job, true);
          }
        }
      }
    }
  }
}
