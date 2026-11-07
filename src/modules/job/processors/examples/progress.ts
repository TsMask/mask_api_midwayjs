/**
 * 进度任务处理器
 * @param data 调度任务信息
 * @returns 处理结果
 */
export async function progressProcessor(
  data: any
): Promise<Record<string, any>> {
  for (let progress = 0; progress < 20; progress += 1) {
    await sleep(2000);
  }

  return {
    job_name: data?.job_name,
    invoke_target: data?.job_invoke_target,
    target_params: data?.job_target_params,
  };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
