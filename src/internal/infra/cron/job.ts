/** Job states returned when a job is submitted to a queue. */
export enum CronJobState {
  Waiting,
  Active,
  Completed,
  Failed,
}

/** Options for one-shot and repeated jobs. */
export interface JobOptions {
  id: string;
  cron?: string;
  concurrent?: boolean;
}
