import type { SysJob } from '../modules/job/model/sys_job';

/** Payload passed to cron and queue processors. */
export type ProcessorOptions = {
  repeat: boolean;
  sysJob: SysJob;
};

/** Processor result payload. */
export type ProcessorData = Partial<ProcessorOptions> & {
  /**其余自定义属性 */
  [key: string]: any;
};
