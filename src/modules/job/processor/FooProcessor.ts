import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

@Processor('foo')
export class FooProcessor implements IProcessor {

    @Inject()
    private ctx: Context;

    async execute(params) {
        // params.aaa => 1
        console.log("params", params)
        let i = 0;
        while (i < 10) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(i++)
                }, 1000);
            })
            await this.ctx.job.progress(i);
        }
        return this.ctx.jobId
    }
}