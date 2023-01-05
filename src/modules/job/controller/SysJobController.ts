import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';
import { FooQueue } from '../queue/FooQueue';
import { TestQueue } from '../queue/TestQueue';

/**
 * 调度任务信息操作处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller("/monitor/job")
export class SysJobController {
  @Inject()
  private testQueue: TestQueue;

  @Inject()
  private fooQueue: FooQueue;

  /**
   * 测试
   */
  @Get('/runJob')
  async runJob(): Promise<Result> {
    // 获取 Processor 相关的队列
    await this.testQueue.runJob();
    await this.fooQueue.runJob();

    return Result.ok();
  }

  /**
  * 测试
  */
  @Get('/pause')
  async pause(): Promise<Result> {
    // 获取 Processor 相关的队列
    await this.testQueue.pause();
    await this.fooQueue.pause();

    return Result.ok();
  }

  /**
 * 测试
 */
  @Get('/resume')
  async resume(): Promise<Result> {
    // 获取 Processor 相关的队列
    await this.testQueue.resume();
    await this.fooQueue.resume();

    return Result.ok();
  }
}
