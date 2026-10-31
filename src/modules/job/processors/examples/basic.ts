import type { ProcessorData, ProcessorOptions } from '../../../../typings/processor';

export function basic(options: ProcessorOptions): ProcessorData {
  const { sysJob } = options;
  return {
    job_name: sysJob.jobName,
    invoke_target: sysJob.jobInvokeTarget,
    target_params: sysJob.jobTargetParams,
  };
}
