import type { JobOptions } from './job';

/** Execution event emitted after a processor finishes. */
export interface JobLogRecord<TData = any> {
  timestamp: number;
  status: string;
  result?: any;
  data: TData;
  opts: JobOptions;
}

/** Callback used by the business module to persist job logs. */
export type JobLogSink<TData = any> = (
  record: JobLogRecord<TData>
) => void | Promise<void>;

/** Engine acceptance or callback failure; processor failures use JobLogRecord. */
export interface EngineError {
  timestamp: number;
  queue: string;
  id: string;
  error: Error;
}

/** Callback used to observe cron engine errors. */
export type EngineErrorSink = (event: EngineError) => void | Promise<void>;
