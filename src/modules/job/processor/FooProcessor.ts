import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

@Processor('foo')
export class FooProcessor implements IProcessor {

    @Inject()
    private ctx: Context;

    async execute(params) {
        // params.aaa => 1
        console.log("params", params)
        setTimeout(() => {
            console.log(this.ctx.jobId + " - " + this.ctx.job.id)
        }, 2000);
        this.ctx.job.id
    }
}