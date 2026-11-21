import {
  Controller,
  Get,
  Inject,
  MidwayInformationService,
} from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';

import { GlobalConfig } from '../../../internal/config/config';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { RedisCache } from '../../../internal/infra/cache/redis';
import { Resp } from '../../../internal/web/resp/api';

/** 存活与依赖就绪检查。 */
@Controller('/')
export class HealthController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private db: DynamicDataSource;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private config: GlobalConfig;

  @Inject()
  private midwayInformationService: MidwayInformationService;

  /** 进程存活检查，不访问外部依赖。 */
  @Get('/healthz')
  public async live(): Promise<Resp> {
    return Resp.okData({
      status: 'up',
      version: this.midwayInformationService.getPkg().version,
      uptime: uptimeSeconds(this.config.getRunTime()),
    });
  }

  /** 默认数据库与 Redis 就绪检查。 */
  @Get('/readyz')
  public async ready(): Promise<Resp> {
    try {
      const dataSource = this.db.db('');
      if (!dataSource?.isInitialized) {
        throw new Error('database unavailable');
      }
      await withTimeout(dataSource.query('SELECT 1'), 'database unavailable');

      const redis = await this.redisCache.rdb('');
      if (!redis) {
        throw new Error('cache unavailable');
      }
      const pong = await withTimeout(redis.ping(), 'cache unavailable');
      if (pong !== 'PONG') {
        throw new Error('cache unavailable');
      }
    } catch (error) {
      this.c.status = 503;
      return Resp.errMsg(
        error instanceof Error ? error.message : 'dependency unavailable'
      );
    }

    return Resp.okData({
      status: 'ready',
      version: this.midwayInformationService.getPkg().version,
      uptime: uptimeSeconds(this.config.getRunTime()),
    });
  }
}

/** 进程已运行秒数 */
function uptimeSeconds(runTime: Date): number {
  return Math.floor((Date.now() - runTime.getTime()) / 1000);
}

function withTimeout<T>(task: Promise<T>, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), 2000);
    Promise.resolve(task).then(
      value => {
        clearTimeout(timer);
        resolve(value);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
