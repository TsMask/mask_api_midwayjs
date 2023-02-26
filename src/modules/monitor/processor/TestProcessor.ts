import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

/**
 * 测试 队列任务处理
 *
 * @author TsMask
 */
@Processor('test')
export class TestProcessor implements IProcessor {
  @Inject()
  private ctx: Context;

  async execute(options: ProcessorOptions): Promise<ProcessorData> {
    const log = this.ctx.getLogger();
    const ctxJob = this.ctx.job;

    // 执行一次得到是直接得到传入的jobId
    // 重复任务得到编码格式的jobId => repeat:编码Jobid:执行时间戳
    log.info('原始jonId: %s | 当前jobId %s', options.jobId, ctxJob.id);

    // 遍历参数传入，必有原始jobId
    for (const key in options) {
      if (Object.prototype.hasOwnProperty.call(options, key)) {
        log.info('传入参数： %s => %s', key, options[key]);
      }
    }

    // 返回结果，用于记录执行结果
    return options;
  }
}
