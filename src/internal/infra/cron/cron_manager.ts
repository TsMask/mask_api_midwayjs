import { Inject, Provide, Singleton } from '@midwayjs/core';
import { BullMQQueue, Framework } from '@midwayjs/bullmq';
import type { Job, Worker } from 'bullmq';

import { STATUS_NO, STATUS_YES } from '../../shared/constants/common';

/** 任务处理器 */
export type CronProcessor<TData = any, TResult = any> = (
  data: TData
) => Promise<TResult> | TResult;

/** 任务日志记录 */
export interface CronJobLogRecord<TData = any> {
  /** 触发时间戳（毫秒） */
  timestamp: number;
  /** 执行状态：1 成功，0 失败 */
  status: string;
  /** 执行结果，失败时为错误信息 */
  result?: any;
  /** 任务入参 */
  data: TData;
  /** 任务 ID */
  id: string;
}

/** 任务调度参数 */
export interface CronJobOptions {
  /** 队列名称 */
  queue: string;
  /** 任务 ID */
  id: string;
  /** cron 表达式，传入时按定时任务注册调度器 */
  cron?: string;
  /** 任务入参 */
  data?: any;
  /** 任务名称 */
  name?: string;
  /** 是否允许并发执行 */
  concurrent?: boolean;
}

/** 任务日志回调 */
export type CronJobLogSink = (record: CronJobLogRecord) => void | Promise<void>;

/** 调度异常事件 */
export interface CronErrorEvent {
  /** 队列名称 */
  queue: string;
  /** 任务 ID */
  id: string;
  /** 异常信息 */
  message: string;
  /** 原始异常 */
  cause?: Error;
}

/** 调度异常回调 */
export type CronErrorSink = (event: CronErrorEvent) => void;

/**
 * 基于 @midwayjs/bullmq 的定时任务封装。
 * 队列、Worker、调度器均由 BullMQ 负责，这里只做一层薄封装。
 */
@Provide()
@Singleton()
export class CronManager {
  @Inject()
  private framework!: Framework;

  private jobLogSink?: CronJobLogSink;
  private errorSink?: CronErrorSink;
  private sequence = 0;

  /** 注册任务日志回调 */
  setOnJobLog(sink?: CronJobLogSink): void {
    this.jobLogSink = sink;
  }

  /** 注册调度异常回调 */
  setOnError(sink?: CronErrorSink): void {
    this.errorSink = sink;
  }

  /** 注册队列与处理器，同名队列重复注册时复用已有实例 */
  registerQueue(name: string, processor: CronProcessor): BullMQQueue {
    const queue =
      this.framework.getQueue(name) ?? this.framework.createQueue(name);
    if (!this.framework.getWorker(name)) {
      const worker = this.framework.createWorker(name, async (job: Job) =>
        processor(job.data)
      );
      this.bindWorker(name, worker);
    }
    return queue;
  }

  /** 获取队列 */
  getQueue(name: string): BullMQQueue {
    return this.framework.getQueue(name);
  }

  /** 已注册的队列名称 */
  queueNames(): string[] {
    return this.framework.getQueueList().map(queue => queue.getQueueName());
  }

  /**
   * 调度任务：传入 cron 时注册定时调度器，否则立即入队执行一次
   * @param options 调度参数
   * @returns 是否受理成功
   */
  async run(options: CronJobOptions): Promise<boolean> {
    const queue = this.framework.getQueue(options.queue);
    if (!queue) {
      this.emitError(
        options.queue,
        options.id,
        new Error(`queue not found: ${options.queue}`)
      );
      return false;
    }
    if (options.cron) {
      return await this.schedule(queue, options);
    }
    return await this.runOnce(queue, options);
  }

  /**
   * 移除任务：删除定时调度器与未完成的单次任务
   * @param queueName 队列名称
   * @param id 任务 ID
   */
  async remove(queueName: string, id: string): Promise<void> {
    const queue = this.framework.getQueue(queueName);
    if (!queue) return;
    try {
      await queue.removeJobScheduler(this.schedulerId(id));
      const jobs = await queue.getJobs([
        'wait',
        'delayed',
        'waiting-children',
        'prioritized',
      ]);
      for (const job of jobs) {
        if (this.matchJobId(job.id, id)) {
          await job.remove();
        }
      }
    } catch (error) {
      this.emitError(queueName, id, error);
    }
  }

  /** 注册定时调度器 */
  private async schedule(
    queue: BullMQQueue,
    options: CronJobOptions
  ): Promise<boolean> {
    const schedulerId = this.schedulerId(options.id);
    try {
      // 先移除旧调度器，避免调度器 ID 冲突与残留的延迟任务
      await queue.removeJobScheduler(schedulerId);
      await queue.upsertJobScheduler(
        schedulerId,
        { pattern: options.cron },
        { name: options.name ?? schedulerId, data: options.data ?? {} }
      );
      return true;
    } catch (error) {
      this.emitError(options.queue, options.id, error);
      return false;
    }
  }

  /** 立即执行一次 */
  private async runOnce(
    queue: BullMQQueue,
    options: CronJobOptions
  ): Promise<boolean> {
    const jobId = this.jobId(options);
    try {
      const existing = await queue.getJob(jobId);
      if (existing) {
        // 任务正在执行中，禁止并发
        if (await existing.isActive()) {
          return true;
        }
        await existing.remove();
      }
      await queue.add(options.name ?? jobId, options.data ?? {}, { jobId });
      return true;
    } catch (error) {
      this.emitError(options.queue, options.id, error);
      return false;
    }
  }

  /** 监听 Worker 的完成与失败事件，转成任务日志 */
  private bindWorker(queueName: string, worker: Worker): void {
    if (worker.listenerCount('completed') > 0) return;
    worker.on('error', error => {
      this.emitError(queueName, '', error);
    });
    worker.on('completed', async (job: Job, result: any) => {
      await this.emitJobLog(queueName, {
        id: this.jobIdOf(job),
        timestamp: job?.processedOn ?? job?.timestamp ?? Date.now(),
        status: STATUS_YES,
        result,
        data: job?.data,
      });
    });
    worker.on('failed', async (job: Job | undefined, error: Error) => {
      await this.emitJobLog(queueName, {
        id: this.jobIdOf(job),
        timestamp: job?.processedOn ?? job?.timestamp ?? Date.now(),
        status: STATUS_NO,
        result: error?.message ?? String(error),
        data: job?.data,
      });
    });
  }

  /** 分发任务日志 */
  private async emitJobLog(
    queueName: string,
    record: CronJobLogRecord
  ): Promise<void> {
    if (!this.jobLogSink) return;
    try {
      await this.jobLogSink(record);
    } catch (error) {
      this.emitError(queueName, record.id, error);
    }
  }

  /** 分发调度异常 */
  private emitError(queue: string, id: string, error: any): void {
    if (!this.errorSink) return;
    try {
      this.errorSink({
        queue,
        id,
        message: error?.message ?? String(error),
        cause: error instanceof Error ? error : undefined,
      });
    } catch {
      // 异常回调自身失败不应打断调度
    }
  }

  /** 任务 ID，BullMQ 不允许纯数字 JobID */
  private jobId(options: CronJobOptions): string {
    if (options.concurrent) {
      this.sequence += 1;
      return `job_${options.id}_${this.sequence}`;
    }
    return `job_${options.id}`;
  }

  /** 调度器 ID */
  private schedulerId(id: string): string {
    return `job_${id}`;
  }

  /** 判断任务是否属于指定的任务 ID */
  private matchJobId(jobId: string | undefined, id: string): boolean {
    if (!jobId) return false;
    return jobId === `job_${id}` || jobId.startsWith(`job_${id}_`);
  }

  /** 从 Job 中取出任务 ID */
  private jobIdOf(job: Job | undefined): string {
    return String(job?.data?.sysJob?.id ?? job?.id ?? '');
  }
}
