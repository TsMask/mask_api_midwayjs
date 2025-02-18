import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/core';

/**Foo 队列任务处理  */
@Processor('foo')
export class FooProcessor implements IProcessor {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  async execute(options: ProcessorOptions): Promise<ProcessorData> {
    const log = this.c.getLogger();
    const ctxJob = this.c.job;

    // 执行一次得到是直接得到传入的jobId
    // 重复任务得到编码格式的jobId => repeat:编码Jobid:执行时间戳
    // options 获取任务执行时外部给到的参数数据
    // log 日志输出到bull配置的文件内
    // ctxJob 当前任务的上下文，可控制暂停进度等数据

    const { repeat, sysJob } = options;

    let i = 0;
    while (i < 20) {
      // 获取任务进度
      const progress = await ctxJob.progress();
      log.info('jonId: %d => 任务进度：%d', sysJob.jobId, progress);
      // 延迟响应
      await new Promise(resolve => setTimeout(() => resolve(i++), 2000));
      // 改变任务进度
      await ctxJob.progress(i);
    }

    // 返回结果，用于记录执行结果
    return {
      repeat: repeat,
      jobName: sysJob.jobName,
      invokeTarget: sysJob.invokeTarget,
      targetParams: sysJob.targetParams,
    };
  }
}
