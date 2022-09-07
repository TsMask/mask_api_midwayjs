import { Provide, Inject, TaskLocal, FORMAT } from '@midwayjs/decorator';

@Provide()
export class UpdataDataTask {
  @Inject()
  logger;

  // 只能做到单进程的事情，即每台机器的都会被执行。
  // 例如下面是每30分钟执行一次
  // @TaskLocal("0 */30 * * * *")
  @TaskLocal(FORMAT.CRONTAB.EVERY_PER_30_MINUTE)
  async task() {
    // 会输出在日志文件里
    this.logger.warn('本地定时任务=>', '单线程，建议按时间执行');
  }
}
