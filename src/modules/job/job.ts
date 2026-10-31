import {
  Configuration,
  Inject,
  type IMidwayApplication,
  type IMidwayContainer,
} from '@midwayjs/core';
import * as bullmq from '@midwayjs/bullmq';

import { CronManager } from '../../internal/infra/cron/cron';
import { SysJobService } from './service/sys_job';
import { basic } from './processors/examples/basic';
import { progress } from './processors/examples/progress';
import { errorProcessor } from './processors/examples/error';

@Configuration({
  imports: [bullmq],
})
export class JobModule {
  @Inject()
  private cronManager!: CronManager;

  @Inject()
  private sysJobService!: SysJobService;

  async onServerReady(
    _: IMidwayContainer,
    app: IMidwayApplication
  ): Promise<void> {
    // 引擎与业务解耦：执行事件统一交给持久化钩子处理。
    this.cronManager.setOnJobLog(async record => {
      await this.sysJobService.saveJobLog(record);
    });
    this.cronManager.setOnEngineError(event => {
      app
        .getLogger()
        .error(
          'cron engine error queue=%s id=%s message=%s',
          event.queue,
          event.id,
          event.error.message
        );
    });

    this.cronManager.createQueue('test_job', basic);
    this.cronManager.createQueue('test_progress', progress);
    this.cronManager.createQueue('test_error', errorProcessor);
  
  
    // 初始化定时任务
    await this.sysJobService.reset();
  }
}

export const JobConfiguration = {
  Configuration: JobModule,
};
