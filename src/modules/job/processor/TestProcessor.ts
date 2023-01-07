import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

@Processor('test')
export class TestProcessor implements IProcessor {

    @Inject()
    private ctx: Context;

    async execute(params) {
        // params.aaa => 1
        console.log(this.ctx.jobId + " - " + this.ctx.job.timestamp + " - params=>", params)
        console.log(this.ctx.jobId + " - " + await this.ctx.job.progress() + " - " + await this.ctx.job.getState())

        let i = 0;
        while (i < 10) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(i++)
                }, 1000);
            })
            await this.ctx.job.progress(i);
            // if (i == 2) {
            //     throw new Error("数据异常" + this.ctx.startTime)
            // }
        }
        return i;
    }


}