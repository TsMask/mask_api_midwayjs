import { BullFramework } from '@midwayjs/bull/dist/framework';
import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';

/**
 * 调度任务信息操作处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/monitor/test')
export class SysJobController {
  @Inject()
  private bullFramework: BullFramework;

  /**
   * 测试
   */
  @Get('/runJob')
  async runJob(): Promise<Result> {
    // 获取 Processor 相关的队列
    const queueList = this.bullFramework.getQueueList();
    for (const queue of queueList) {
      const rc = await queue.getRepeatableCount();
      console.log(rc + ' ============');

      queue.removeRepeatable({
        jobId: 'testID01',
        cron: '*/5 * * * * *',
      });

      // 移除全部监听
      queue.removeAllListeners();
      // 添加完成监听
      queue.addListener('completed', (job, result) => {
        console.log(`Job ${job.id} completed! Result: ${result}`);
        job.remove();
      });
      // 添加失败监听
      queue.addListener('failed', (job, error) => {
        // A job failed with reason `err`!
        console.log(`Job ${job.id} failed! Error: ${error}`);
        job.remove();
      });
    }

    // 获取 Processor 相关的队列
    const testQueue = this.bullFramework.getQueue('test');
    // testQueue.removeAllListeners()
    // let count = await testQueue.count();
    // console.log(count)
    // if (count > 0) return Result.err()

    // Local events pass the job instance...
    // testQueue.addListener('progress', async (job, progress) => {
    //   console.log(`Job ${job.id} is ${progress}% ready! ${await job.getState()}`);

    // });

    await testQueue.runJob(
      { a: 1 },
      {
        delay: 1000,
        jobId: 'testID01',
        repeat: {
          cron: '*/5 * * * * *',
        },
      }
    );

    return Result.ok();
  }

  /**
   * 测试
   */
  @Get('/testRm')
  async testRm(): Promise<Result> {
    // 获取 Processor 相关的队列
    const testQueue = this.bullFramework.getQueue('test');

    console.log('getQueueName=> ', testQueue.getQueueName());
    console.log('base64Name=> ', testQueue.base64Name());
    console.log('count=> ', await testQueue.count());
    console.log('getJobCounts=> ', await testQueue.getJobCounts());
    console.log('getRepeatableCount=> ', await testQueue.getRepeatableCount());
    console.log('getRepeatableJobs=> ', await testQueue.getRepeatableJobs());

    // 暂停
    // testQueue.pause()
    // 通过队列手动执行清理
    // testQueue.obliterate();
    testQueue.removeRepeatable({
      jobId: 'testID01',
      cron: '*/5 * * * * *',
    });

    console.log('getQueueName=> ', testQueue.getQueueName());
    console.log('base64Name=> ', testQueue.base64Name());
    console.log('count=> ', await testQueue.count());
    console.log('getJobCounts=> ', await testQueue.getJobCounts());
    console.log('getRepeatableCount=> ', await testQueue.getRepeatableCount());
    console.log('getRepeatableJobs=> ', await testQueue.getRepeatableJobs());

    return Result.ok();
  }

  /**
   * 测试
   */
  @Get('/runOne')
  async runOne(): Promise<Result> {
    // 获取 Processor 相关的队列
    const testQueue = this.bullFramework.getQueue('test');

    const count = await testQueue.count();
    console.log(count);
    // if (count > 0) return Result.err()

    // Local events pass the job instance...
    // testQueue.once('progress', async (job, progress) => {
    //   console.log(`Job ${job.id} is ${progress}% ready! ${await job.getState()}`);

    // });

    const sosd = await testQueue.getJob('testID01');
    if (sosd) {
      const isActive = await sosd.isActive();
      console.log('isActive  ', isActive);
      if (isActive) return Result.err();
      await sosd.remove();
    }

    await testQueue.runJob(
      { a: 4 },
      {
        delay: 1000,
        jobId: 'testID01',
      }
    );

    const sod = await testQueue.getJob('testID01');
    console.log('sod===  ', sod.id);

    return Result.ok();
  }

  /**
   * 测试
   */
  @Get('/foo')
  async pause(): Promise<Result> {
    const fooQueue = this.bullFramework.getQueue('foo');
    fooQueue.removeAllListeners();
    // Local events pass the job instance...
    fooQueue.on('progress', async (job, progress) => {
      console.log(
        `Job ${job.id} is ${progress}% ready! ${await job.getState()}`
      );
    });

    fooQueue.on('completed', (job, result) => {
      console.log(`Job ${job.id} completed! Result: ${result}`);
      job.remove();
    });

    fooQueue.on('failed', (job, err) => {
      // A job failed with reason `err`!
      console.log(`Job ${job.id} failed! Error: ${err}`);
      job.remove();
    });
    await fooQueue.runJob({ b: 1 }, { delay: 1000, jobId: 'fooID01' });

    return Result.ok();
  }

  /**
   * 测试
   */
  @Get('/rm')
  async resume(): Promise<Result> {
    // 获取 Processor 相关的队列
    const fooQueue = this.bullFramework.getQueue('foo');
    fooQueue.clean(100);

    return Result.ok();
  }
}
