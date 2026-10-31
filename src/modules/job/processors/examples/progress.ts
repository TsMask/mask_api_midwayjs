import type { SysJob } from '../../model/sys_job';

export async function progress(sysJob: SysJob): Promise<Record<string, any>> {
  for (let progress = 0; progress < 20; progress += 1) {
    await sleep(2000);
  }

  return {
    job_name: sysJob.jobName,
    invoke_target: sysJob.jobInvokeTarget,
    target_params: sysJob.jobTargetParams,
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
