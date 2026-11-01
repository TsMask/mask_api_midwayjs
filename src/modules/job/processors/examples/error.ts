/**
 * 错误任务处理器
 * @param data 调度任务信息
 * @returns 处理结果
 */
export async function errorProcessor(data: any): Promise<Record<string, any>> {
  for (let progress = 0; progress < 5; progress += 1) {
    await sleep(2000);
    if (progress === 3) {
      throw new Error('程序中途执行错误');
    }
  }

  return {
    job_name: data?.jobName,
    invoke_target: data?.jobInvokeTarget,
    target_params: data?.jobTargetParams,
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
