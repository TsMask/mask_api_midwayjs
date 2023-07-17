import { Job } from '@midwayjs/bull';
import { BullFramework } from '@midwayjs/bull/dist/framework';
import { Provide, Inject, Singleton, Init } from '@midwayjs/decorator';
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
@Singleton()
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

  async checkUniqueJob(
    jobName: string,
    jobGroup: string,
    jobId: string = ''
  ): Promise<boolean> {
    const sysJob = new SysJob();
    sysJob.jobName = jobName;
    sysJob.jobGroup = jobGroup;
    const uniqueId = await this.sysJobRepository.checkUniqueJob(sysJob);
    if (uniqueId === jobId) {
      return true;
    }
    return !uniqueId;
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
    if (!queue) return false;

    const jobId = sysJob.jobId;

    // 判断是否给队列添加完成和失败的监听事件
    const completedOnCount = queue.listenerCount('completed');
    if (completedOnCount === 0) {
      // 添加完成监听
      queue.addListener(
        'completed',
        async (job: Job, result: ProcessorData) => {
          const { sysJob }: ProcessorOptions = job.data;
          // 记录调度日志
          const sysJobLog = new SysJobLog().new(
            sysJob.jobName,
            sysJob.jobGroup,
            sysJob.invokeTarget,
            sysJob.targetParams,
            STATUS_YES,
            JSON.stringify(result).substring(0, 500)
          );
          await this.sysJobLogRepository.insertJobLog(sysJobLog);
          await job.remove();
        }
      );
      // 添加失败监听
      queue.addListener('failed', async (job: Job, error: Error) => {
        const { sysJob }: ProcessorOptions = job.data;
        const errorStr = JSON.stringify({
          name: error.name,
          message: error.message,
        });
        // 记录调度日志
        const sysJobLog = new SysJobLog().new(
          sysJob.jobName,
          sysJob.jobGroup,
          sysJob.invokeTarget,
          sysJob.targetParams,
          STATUS_NO,
          errorStr.substring(0, 500)
        );
        await this.sysJobLogRepository.insertJobLog(sysJobLog);
        await job.remove();
      });
    }

    // 给执行任务数据参数
    const options = {
      repeat: repeat,
      sysJob: sysJob,
    };

    // 不是重复任务的情况，立即执行一次
    if (!repeat) {
      // 判断是否已经有单次执行任务
      let job = await queue.getJob(jobId);
      if (job) {
        // 拒绝执行已经进行中的，其他状态的移除
        const isActive = await job.isActive();
        if (isActive) {
          return false;
        }
        await job.remove();
      }
      // 执行单次任务
      job = await queue.runJob(options, { jobId: jobId });
      // 执行中或等待中的都返回正常
      const isActive = await job.isActive();
      const isWaiting = await job.isWaiting();
      return isActive || isWaiting;
    }

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
    await queue.runJob(options, {
      jobId: jobId,
      repeat: {
        cron: sysJob.cronExpression,
      },
    });
    return true;
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
    // 获取bull上注册的队列列表
    const queueList = this.bullFramework.getQueueList();
    if (queueList && queueList.length > 0) {
      for (const queue of queueList) {
        // 查询系统中定义状态为正常启用的任务
        const sysJob = await this.sysJobRepository.selectJobByInvokeTarget(
          queue.getQueueName()
        );
        if (sysJob && sysJob.status === STATUS_YES) {
          await this.insertQueueJob(sysJob, true);
        }
      }
    }
  }
}
