import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

/**
 * Bar 队列任务处理
 *
 * @author TsMask
 */
@Processor('bar')
export class BarProcessor implements IProcessor {
  @Inject()
  private ctx: Context;

  async execute(options: ProcessorOptions): Promise<ProcessorData> {
    const log = this.ctx.getLogger();
    const ctxJob = this.ctx.job;

    // 执行一次得到是直接得到传入的jobId
    // 重复任务得到编码格式的jobId => repeat:编码Jobid:执行时间戳
    // log.info("原始jonId: %s | 当前jobId %s", options.jobId, ctxJob.id);

    let i = 0;
    while (i < 10) {
      // 获取任务进度
      const progress = await ctxJob.progress();
      log.info('jonId: %s => 任务进度：', options.jobId, progress);
      // 延迟响应
      await new Promise(resolve => setTimeout(() => resolve(i), 1000));
      // 程序中途执行错误
      if (i > 3) {
        throw new Error('程序中途执行错误');
      }
      // 改变任务进度
      await ctxJob.progress(i++);
    }

    // 返回结果，用于记录执行结果
    return options;
  }
}
