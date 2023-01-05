import { Processor, IProcessor, Context } from '@midwayjs/bull';
import { Inject } from '@midwayjs/decorator';

@Processor('test')
export class TestProcessor implements IProcessor {

    @Inject()
    private ctx: Context;

    async execute(params) {
        // params.aaa => 1
        console.log("params", params)
        
        console.log(this.ctx.jobId + " - " + await this.ctx.job.isCompleted() )  
    }

    
}