import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

/**
 * 简单示例 队列任务处理
 *
 * @author TsMask
 */
@Processor('simple')
export class SimpleProcessor implements IProcessor {
  @Inject()
  private ctx: Context;

  async execute(options: ProcessorOptions): Promise<ProcessorData> {
    const log = this.ctx.getLogger();
    const ctxJob = this.ctx.job;

    // 执行一次得到是直接得到传入的jobId
    // 重复任务得到编码格式的jobId => repeat:编码Jobid:执行时间戳
    // options 获取任务执行时外部给到的参数数据
    // log 日志输出到bull配置的文件内
    // ctxJob 当前任务的上下文，可控制暂停进度等数据

    const { repeat, sysJob } = options;

    log.info('原始jonId: %s | 当前jobId %s', sysJob.jobId, ctxJob.id);

    // 返回结果，用于记录执行结果
    return {
      repeat: repeat,
      jobName: sysJob.jobName,
      invokeTarget: sysJob.invokeTarget,
      targetParams: sysJob.targetParams,
    };
  }
}
