import { Inject, Provide, Singleton } from '@midwayjs/core';

import { CronManager } from '../../../internal/infra/cron/cron_manager';
import { basic } from '../processors/examples/basic';
import { progress } from '../processors/examples/progress';
import { error } from '../processors/examples/error';

/** Registers job demo processors independently from the scheduler engine. */
@Provide()
@Singleton()
export class MonitorCronProcessors {
  @Inject()
  private cronManager!: CronManager;

  private registered = false;

  public register(): void {
    if (this.registered) return;
    this.registered = true;

    this.cronManager.registerQueue('simple', basic);
    this.cronManager.registerQueue('foo', progress);
    this.cronManager.registerQueue('bar', error);

    // Gin baseline queue names, retained for data migrated from mask_api_gin.
    this.cronManager.registerQueue('test_job', basic);
    this.cronManager.registerQueue('test_progress', progress);
    this.cronManager.registerQueue('test_error', error);
  }
}
