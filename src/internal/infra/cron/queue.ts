import type { BullMQQueue } from '@midwayjs/bullmq';

import { CronJobState, type JobOptions } from './job';

/** Processor function executed by a cron queue. */
export type QueueProcessor<TData = any, TResult = any> = (
  data: TData
) => Promise<TResult> | TResult;

/** Internal BullMQ envelope. It keeps business data separate from job options. */
export interface CronJobEnvelope<TData = any> {
  data: TData;
  opts: JobOptions;
}

type QueueEngine = (queue: string, id: string, error: any) => void;

/** Cron queue owned by the CronManager. */
export class CronQueue<TData = any> {
  readonly name: string;
  private readonly queue: BullMQQueue;
  private readonly engine: QueueEngine;
  private sequence = 0;

  constructor(name: string, queue: BullMQQueue, engine: QueueEngine) {
    this.name = name;
    this.queue = queue;
    this.engine = engine;
  }

  /**
   * Submit a one-shot or repeated job.
   *
   * Waiting means accepted, Active means the same non-concurrent job is
   * already running, and Failed means BullMQ rejected the submission.
   */
  async runJob(data: TData, opts: JobOptions): Promise<CronJobState> {
    try {
      if (!opts?.id) {
        throw new Error('cron job id is required');
      }
      if (opts.cron) {
        await this.schedule(data, opts);
        return CronJobState.Waiting;
      }
      return await this.runOnce(data, opts);
    } catch (error) {
      this.engine(this.name, opts?.id ?? '', error);
      return CronJobState.Failed;
    }
  }

  /** Remove a scheduler and its pending one-shot jobs. */
  async removeJob(id: string): Promise<boolean> {
    try {
      await this.queue.removeJobScheduler(this.schedulerId(id));
      const jobs = await this.queue.getJobs([
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
      return true;
    } catch (error) {
      this.engine(this.name, id, error);
      return false;
    }
  }

  private async schedule(data: TData, opts: JobOptions): Promise<void> {
    const schedulerId = this.schedulerId(opts.id);
    await this.queue.removeJobScheduler(schedulerId);
    await this.queue.upsertJobScheduler(
      schedulerId,
      { pattern: opts.cron },
      { name: schedulerId, data: this.envelope(data, opts) }
    );
  }

  private async runOnce(data: TData, opts: JobOptions): Promise<CronJobState> {
    const jobId = this.jobId(opts);
    const existing = await this.queue.getJob(jobId);
    if (existing) {
      if (await existing.isActive()) return CronJobState.Active;
      await existing.remove();
    }
    await this.queue.add(jobId, this.envelope(data, opts), { jobId });
    return CronJobState.Waiting;
  }

  private envelope(data: TData, opts: JobOptions): CronJobEnvelope<TData> {
    return { data, opts };
  }

  private jobId(opts: JobOptions): string {
    if (opts.concurrent) {
      this.sequence += 1;
      return `job_${opts.id}_${this.sequence}`;
    }
    return `job_${opts.id}`;
  }

  private schedulerId(id: string): string {
    return `job_${id}`;
  }

  private matchJobId(jobId: string | undefined, id: string): boolean {
    if (!jobId) return false;
    return jobId === `job_${id}` || jobId.startsWith(`job_${id}_`);
  }
}
