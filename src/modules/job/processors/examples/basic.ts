import type { SysJob } from '../../model/sys_job';

export function basic(sysJob: SysJob): Record<string, any> {
  return {
    job_name: sysJob?.jobName,
    invoke_target: sysJob?.jobInvokeTarget,
    target_params: sysJob?.jobTargetParams,
  };
}
