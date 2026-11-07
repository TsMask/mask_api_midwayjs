/**
 * 基本任务处理器
 * @param data 调度任务信息
 * @returns 处理结果
 */
export function basicProcessor(data: any): Record<string, any> {
  return {
    job_name: data?.job_name,
    invoke_target: data?.job_invoke_target,
    target_params: data?.job_target_params,
  };
}
