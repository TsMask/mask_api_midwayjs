import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

@Processor('test')
export class TestProcessor implements IProcessor {
  @Inject()
  private ctx: Context;

  async execute(options: ProcessorOptions): Promise<ProcessorData> {
    // params.aaa => 1
    console.log(this.ctx.jobId + ' - ' + ' - params=>', options);
    console.log(this.ctx.jobId + ' - ' + (await this.ctx.job.getState()));

    let i = 0;
    while (i < 1) {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve(i++);
        }, 1000);
      });
      await this.ctx.job.progress(i);
      // if (i == 2) {
      //     throw new Error("数据异常" + this.ctx.startTime)
      // }
    }
    return options;
  }
}
