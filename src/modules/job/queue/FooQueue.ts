import { InjectQueue, BullQueue } from "@midwayjs/bull";
import { FORMAT, Provide, Scope, ScopeEnum } from "@midwayjs/core";

/**
 * foo 任务队列管理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class FooQueue {
  @InjectQueue('foo')
  private fooQueue: BullQueue;

  async runJob() {
    // 立即执行这个任务 
    const job = await this.fooQueue?.runJob({ ok: "foo" }, {
      repeat: {
        cron: FORMAT.CRONTAB.EVERY_MINUTE
      }
    });
    // 更新进度
    // await job.progress(60);
    // 获取进度
    const progress = await job.progress();
    console.log("progress", progress)

    const state = await job.getState();
    console.log("state", state)
    // state => 'delayed' 延迟状态
    // state => 'completed' 完成状态

    // ...
  }

  async pause() {
    await this.fooQueue.pause();
    // ...
  }
  async resume() {
    await this.fooQueue.resume();
    // ...
  }

}
