import { Controller, Inject, Get, Del, Query } from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';

import {
  CACHE_SYS_CONFIG,
  CACHE_SYS_DICT,
  CACHE_CAPTCHA_CODE,
  CACHE_REPEAT_SUBMIT,
  CACHE_RATE_LIMIT,
  CACHE_PWD_ERR_COUNT,
  CACHE_TOKEN_SESSION,
  CACHE_TOKEN_USERS,
} from '../../../internal/shared/constants/cache_key';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { RedisCache } from '../../../internal/infra/cache/redis';
import { Resp } from '../../../internal/web/resp/api';
import { SysCache } from '../model/sys_cache';

/**缓存信息 控制层处理 */
@Controller('/api/v1/monitor/cache')
export class CacheController {
  /**缓存服务 */
  @Inject()
  private redisCache: RedisCache;

  /**Redis信息 */
  @Get('', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['monitor:cache:info'] })],
  })
  public async info(): Promise<Resp> {
    return Resp.okData({
      info: await this.redisCache.info(''),
      db_size: await this.redisCache.keySize(''),
      command_stats: await this.redisCache.commandStats(''),
    });
  }

  /**缓存名称列表 */
  @Get('/names', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['monitor:cache:list'] })],
  })
  public async names(): Promise<Resp> {
    const caches: SysCache[] = [
      new SysCache().newNames('用户令牌', CACHE_TOKEN_SESSION),
      new SysCache().newNames('用户会话索引', CACHE_TOKEN_USERS),
      new SysCache().newNames('配置信息', CACHE_SYS_CONFIG),
      new SysCache().newNames('数据字典', CACHE_SYS_DICT),
      new SysCache().newNames('用户验证码', CACHE_CAPTCHA_CODE),
      new SysCache().newNames('防重提交', CACHE_REPEAT_SUBMIT),
      new SysCache().newNames('限流处理', CACHE_RATE_LIMIT),
      new SysCache().newNames('密码错误次数', CACHE_PWD_ERR_COUNT),
    ];
    return Resp.okData(caches);
  }

  /**缓存名称下键名列表 */
  @Get('/keys', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['monitor:cache:list'] })],
  })
  public async keys(
    @Valid(Joi.string().required()) @Query('cache_name') cacheName: string
  ): Promise<Resp> {
    const cacheKeys = await this.redisCache.getKeys('', `${cacheName}:*`);
    const caches: SysCache[] = [];
    for (const key of cacheKeys) {
      caches.push(new SysCache().newKeys(cacheName, key));
    }
    return Resp.okData(caches);
  }

  /**缓存内容信息 */
  @Get('/value', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:cache:query'] }),
    ],
  })
  public async value(
    @Valid(Joi.string().required()) @Query('cache_name') cacheName: string,
    @Valid(Joi.string().required()) @Query('cache_key') cacheKey: string
  ): Promise<Resp> {
    const [cacheValue, err] = await this.redisCache.getValue(
      '',
      `${cacheName}:${cacheKey}`
    );
    if (err) {
      return Resp.errMsg(err);
    }

    let displayValue = cacheValue;
    if (cacheName === CACHE_TOKEN_SESSION && cacheValue) {
      try {
        const info = JSON.parse(cacheValue);
        delete info.permissions;
        if (info.user && typeof info.user === 'object') {
          delete info.user.userPassword;
        }
        displayValue = JSON.stringify(info);
      } catch {
        displayValue = cacheValue;
      }
    }

    const sysCache = new SysCache().newValue(cacheName, cacheKey, cacheValue);
    sysCache.cache_value = displayValue;
    return Resp.okData(sysCache);
  }

  /**缓存名称列表安全删除 */
  @Del('/names', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:cache:remove'] }),
    ],
  })
  public async cleanNames(): Promise<Resp> {
    // 指定清除的缓存列表
    const caches: SysCache[] = [
      new SysCache().newNames('配置信息', CACHE_SYS_CONFIG),
      new SysCache().newNames('数据字典', CACHE_SYS_DICT),
      new SysCache().newNames('用户验证码', CACHE_CAPTCHA_CODE),
      new SysCache().newNames('防重提交', CACHE_REPEAT_SUBMIT),
      new SysCache().newNames('限流处理', CACHE_RATE_LIMIT),
      new SysCache().newNames('密码错误次数', CACHE_PWD_ERR_COUNT),
    ];
    for (const v of caches) {
      const cacheKeys = await this.redisCache.getKeys('', `${v.cache_name}:*`);
      await this.redisCache.delKeys('', cacheKeys);
    }
    return Resp.ok();
  }

  /**缓存名称下键名删除 */
  @Del('/keys', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:cache:remove'] }),
    ],
  })
  public async cleanKeys(
    @Valid(Joi.string().required()) @Query('cache_name') cacheName: string
  ): Promise<Resp> {
    if (cacheName === CACHE_TOKEN_SESSION || cacheName === CACHE_TOKEN_USERS) {
      return Resp.errMsg('不能删除令牌/会话缓存');
    }
    const cacheKeys = await this.redisCache.getKeys('', `${cacheName}:*`);
    await this.redisCache.delKeys('', cacheKeys);
    return Resp.ok();
  }

  /**缓存内容删除 */
  @Del('/value', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:cache:remove'] }),
    ],
  })
  public async cleanValue(
    @Valid(Joi.string().required()) @Query('cache_name') cacheName: string,
    @Valid(Joi.string().required()) @Query('cache_key') cacheKey: string
  ): Promise<Resp> {
    if (cacheName === CACHE_TOKEN_SESSION || cacheName === CACHE_TOKEN_USERS) {
      return Resp.errMsg('不能删除令牌/会话缓存');
    }
    await this.redisCache.del('', cacheName + ':' + cacheKey);
    return Resp.ok();
  }
}