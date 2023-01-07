import { BullFramework } from '@midwayjs/bull/dist/framework';
import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';

/**
 * 调度任务信息操作处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller("/monitor/test")
export class SysJobController {
  @Inject()
  private bullFramework: BullFramework;


  /**
   * 测试
   */
  @Get('/runJob')
  async runJob(): Promise<Result> {
    // 获取 Processor 相关的队列
    const testQueue = this.bullFramework.getQueue("test");
    testQueue.clean(1000)
    testQueue.removeAllListeners()

    console.log("getQueueName=> ", testQueue.getQueueName())
    console.log("base64Name=> ", testQueue.base64Name())
    console.log("count=> ", await testQueue.count())
    console.log("getJobCounts=> ", await testQueue.getJobCounts())
    console.log("getRepeatableCount=> ", await testQueue.getRepeatableCount())
    console.log("getRepeatableJobs=> ", await testQueue.getRepeatableJobs())
    // if (await testQueue.count() > 0) {
    //   testQueue.removeJobs("testID01");
    //   return Result.err()
    // }
    // Local events pass the job instance...
    testQueue.addListener('progress', async (job, progress) => {
      console.log(`Job ${job.id} is ${progress}% ready! ${await job.getState()}`);

    });

    testQueue.addListener('completed', function (job, result) {
      console.log(`Job ${job.id} completed! Result: ${result}`);
      job.remove();
    });

    testQueue.addListener('failed', function (job, err) {
      // A job failed with reason `err`!
      console.log(`Job ${job.id} failed! Error: ${err}`);
      job.remove();
    })

    await testQueue.runJob({ a: 1 }, {
      delay: 1000, jobId: "testID01",
       repeat: {
        cron: "*/5 * * * * *"
      }
    });


    return Result.ok();
  }

  /**
  * 测试
  */
  @Get('/foo')
  async pause(): Promise<Result> {
    const fooQueue = this.bullFramework.getQueue("foo");
    fooQueue.removeAllListeners()
    // Local events pass the job instance...
    fooQueue.on('progress', async (job, progress) => {
      console.log(`Job ${job.id} is ${progress}% ready! ${await job.getState()}`);

    });

    fooQueue.on('completed', function (job, result) {
      console.log(`Job ${job.id} completed! Result: ${result}`);
      job.remove();
    });

    fooQueue.on('failed', function (job, err) {
      // A job failed with reason `err`!
      console.log(`Job ${job.id} failed! Error: ${err}`);
      job.remove();
    })
    await fooQueue.runJob({ b: 1 }, { delay: 1000, jobId: "fooID01" });


    return Result.ok();
  }

  /**
 * 测试
 */
  @Get('/rm')
  async resume(): Promise<Result> {
    // 获取 Processor 相关的队列
    const fooQueue = this.bullFramework.getQueue("foo");
    fooQueue.clean(100)
   
     

    return Result.ok();
  }
}
