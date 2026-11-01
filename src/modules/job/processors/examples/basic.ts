/**
 * 基本任务处理器
 * @param data 调度任务信息
 * @returns 处理结果
 */
export function basicProcessor(data: any): Record<string, any> {
  return {
    job_name: data?.jobName,
    invoke_target: data?.jobInvokeTarget,
    target_params: data?.jobTargetParams,
  };
}
