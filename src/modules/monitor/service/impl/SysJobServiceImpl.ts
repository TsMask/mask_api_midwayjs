import { Job, Framework } from '@midwayjs/bull';
import { Provide, Inject, Singleton, Init } from '@midwayjs/core';
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
  private bullFramework: Framework;

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
    const jobs = await this.sysJobRepository.selectJobByIds([jobId]);
    if (jobs.length > 0) {
      return jobs[0];
    }
    return null;
  }

  async checkUniqueJobName(
    jobName: string,
    jobGroup: string,
    jobId = ''
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
    // 检查是否存在
    const jobs = await this.sysJobRepository.selectJobByIds(jobIds);
    if (jobs.length <= 0) {
      throw new Error('没有权限访问调度任务数据！');
    }
    if (jobs.length === jobIds.length) {
      // 清除任务
      for (const job of jobs) {
        await this.deleteQueueJob(job);
      }
      return await this.sysJobRepository.deleteJobByIds(jobIds);
    }
    return 0;
  }

  async resetQueueJob(): Promise<void> {
    // 获取bull上注册的队列列表
    const queueList = this.bullFramework.getQueueList();
    if (queueList && queueList.length === 0) {
      return;
    }
    // 查询系统中定义状态为正常启用的任务
    const sysJob = new SysJob();
    sysJob.status = STATUS_YES;
    const sysJobs = await this.sysJobRepository.selectJobList(sysJob);
    for (const sysJob of sysJobs) {
      for (const queue of queueList) {
        if (queue.getQueueName() === sysJob.invokeTarget) {
          await this.insertQueueJob(sysJob, true);
        }
      }
    }
  }

  async runQueueJob(sysJob: SysJob): Promise<boolean> {
    return await this.insertQueueJob(sysJob, false);
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
          // 读取任务信息进行保存日志
          const jobLog = {
            timestamp: job.timestamp,
            data: job.data,
            result: result,
          };
          this.saveJobLog(jobLog, STATUS_YES);
          await job.remove();
        }
      );
      // 添加失败监听
      queue.addListener('failed', async (job: Job, error: Error) => {
        // 读取任务信息进行保存日志
        const jobLog = {
          timestamp: job.timestamp,
          data: job.data,
          result: error,
        };
        this.saveJobLog(jobLog, STATUS_NO);
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

  /**
   * 删除调度任务
   *
   * @param sysJob 调度任务信息
   * @return 结果
   */
  private async deleteQueueJob(sysJob: SysJob): Promise<void> {
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

  /**
   * 日志记录保存
   * @param jld 日志记录数据
   * @param status 日志状态
   * @returns
   */
  private async saveJobLog(
    jld: {
      timestamp: number;
      data: ProcessorOptions;
      result: any;
    },
    status: string
  ) {
    // 读取任务信息
    const sysJob = jld.data.sysJob;

    // 任务日志不需要记录
    if (sysJob.saveLog == '' || sysJob.saveLog == STATUS_NO) {
      return;
    }

    // 结果信息key的Name
    let resultNmae = 'failed';
    if (status == STATUS_YES) {
      resultNmae = 'completed';
    }

    // 结果信息序列化字符串
    let jobMsg = JSON.stringify({
      cron: jld.data.repeat,
      name: resultNmae,
      message: jld.result,
    });
    if (jobMsg.length >= 500) {
      jobMsg = jobMsg.substring(0, 500);
    }

    // 创建日志对象
    const sysJobLog = new SysJobLog();
    sysJobLog.jobName = sysJob.jobName;
    sysJobLog.jobGroup = sysJob.jobGroup;
    sysJobLog.invokeTarget = sysJob.invokeTarget;
    sysJobLog.targetParams = sysJob.targetParams;
    sysJobLog.status = status;
    sysJobLog.jobMsg = jobMsg;
    sysJobLog.costTime = Date.now() - jld.timestamp;
    // 插入数据
    await this.sysJobLogRepository.insertJobLog(sysJobLog);
  }
}
