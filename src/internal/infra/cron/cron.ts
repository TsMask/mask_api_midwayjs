import { Inject, Provide, Singleton } from '@midwayjs/core';
import { Framework } from '@midwayjs/bullmq';
import type { Job, Worker } from 'bullmq';

import { STATUS_NO, STATUS_YES } from '../../shared/constants/common';
import { CronQueue, type CronJobEnvelope, type QueueProcessor } from './queue';
import type { EngineErrorSink, JobLogRecord, JobLogSink } from './log';

/** Thin BullMQ-backed equivalent of the Gin cron package facade. */
@Provide()
@Singleton()
export class CronManager {
  @Inject()
  private framework!: Framework;

  private readonly queues = new Map<string, CronQueue<any>>();
  private readonly processors = new Map<string, QueueProcessor>();
  private jobLogSink?: JobLogSink;
  private engineErrorSink?: EngineErrorSink;

  /** Inject a job execution log persistence hook. */
  setOnJobLog(sink?: JobLogSink): void {
    this.jobLogSink = sink;
  }

  /** Inject an engine error hook; processor failures are JobLogRecords. */
  setOnEngineError(sink?: EngineErrorSink): void {
    this.engineErrorSink = sink;
  }

  /** Create a queue and register its processor. */
  createQueue<TData = any, TResult = any>(
    name: string,
    processor: QueueProcessor<TData, TResult>
  ): CronQueue<TData> {
    const queue =
      this.framework.getQueue(name) ?? this.framework.createQueue(name);
    if (!this.framework.getWorker(name)) {
      const worker = this.framework.createWorker(name, async (job: Job) => {
        const envelope = this.envelopeOf(job);
        const processor = this.processors.get(name);
        if (!processor) throw new Error(`queue processor not found: ${name}`);
        return await processor(envelope.data);
      });
      this.bindWorker(name, worker);
    }

    this.processors.set(name, processor);
    const cronQueue = new CronQueue<TData>(
      name,
      queue,
      (queueName, id, error) => this.emitEngineError(queueName, id, error)
    );
    this.queues.set(name, cronQueue);
    return cronQueue;
  }

  /** Get a registered queue by name. */
  getQueue<TData = any>(name: string): CronQueue<TData> | undefined {
    return this.queues.get(name) as CronQueue<TData> | undefined;
  }

  /** Names of queues registered through this facade. */
  queueNames(): string[] {
    return [...this.queues.keys()];
  }

  private emitEngineError(queue: string, id: string, error: any): void {
    if (!this.engineErrorSink) return;
    const event = {
      timestamp: Date.now(),
      queue,
      id,
      error: error instanceof Error ? error : new Error(String(error)),
    };
    void Promise.resolve(this.engineErrorSink(event)).catch(() => undefined);
  }

  private envelopeOf(job: Job | undefined): CronJobEnvelope {
    const data = job?.data as Partial<CronJobEnvelope> | undefined;
    return {
      data: data?.data,
      opts: data?.opts ?? { id: String(job?.id ?? '') },
    };
  }

  private bindWorker(queueName: string, worker: Worker): void {
    worker.on('error', error => {
      this.emitEngineError(queueName, '', error);
    });
    worker.on('completed', (job: Job, result: any) => {
      void this.emitJobLog(queueName, job, STATUS_YES, result);
    });
    worker.on('failed', (job: Job | undefined, error: Error) => {
      void this.emitJobLog(
        queueName,
        job,
        STATUS_NO,
        error?.message ?? String(error)
      );
    });
  }

  private async emitJobLog(
    queueName: string,
    job: Job | undefined,
    status: string,
    result: any
  ): Promise<void> {
    if (!this.jobLogSink) return;
    const envelope = this.envelopeOf(job);
    const record: JobLogRecord = {
      timestamp: job?.processedOn ?? job?.timestamp ?? Date.now(),
      status,
      result,
      data: envelope.data,
      opts: envelope.opts,
    };
    try {
      await this.jobLogSink(record);
    } catch (error) {
      this.emitEngineError(queueName, envelope.opts.id, error);
    }
  }
}
