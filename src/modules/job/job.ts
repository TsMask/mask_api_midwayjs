import {
  Configuration,
  Inject,
  type IMidwayApplication,
  type IMidwayContainer,
  type LifeCycleInvokeOptions,
} from '@midwayjs/core';
import * as bullmq from '@midwayjs/bullmq';

import { CronManager } from '../../internal/infra/cron/cron_manager';
import { MonitorCronProcessors } from './service/cron_processors';
import { SysJobService } from './service/sys_job';

@Configuration({
  imports: [bullmq],
})
export class JobModule {
  @Inject()
  private cronManager!: CronManager;

  @Inject()
  private jobCronProcessors!: MonitorCronProcessors;

  @Inject()
  private sysJobService!: SysJobService;

  async onServerReady(
    _: IMidwayContainer,
    app: IMidwayApplication,
    __?: LifeCycleInvokeOptions
  ): Promise<void> {
    this.cronManager.setOnError(event => {
      app
        .getLogger()
        .error(
          'cron task error queue=%s id=%s message=%s',
          event.queue,
          event.id,
          event.message
        );
    });
    this.jobCronProcessors.register();
    await this.sysJobService.reset();
  }
}

export const JobConfiguration = {
  Configuration: JobModule,
};
