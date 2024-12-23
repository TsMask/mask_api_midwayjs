import { Controller, Inject, Get, Param, Del } from '@midwayjs/core';

import result from '../../../framework/result/result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { SysCache } from '../model/SysCache';
import {
  CACHE_SYS_CONFIG,
  CACHE_SYS_DICT,
  CACHE_CAPTCHA_CODE,
  CACHE_REPEAT_SUBMIT,
  CACHE_RATE_LIMIT,
  CACHE_PWD_ERR_COUNT,
  CACHE_LOGIN_TOKEN,
} from '../../../framework/constants/cache-key';

/**
 * 缓存监控信息
 *
 * @author TsMask
 */
@Controller('/monitor/cache')
export class CacheController {
  @Inject()
  private redisCache: RedisCache;

  /**
   * Redis信息
   *
   * @returns 返回结果
   */
  @Get()
  @PreAuthorize({ hasPermissions: ['monitor:cache:info'] })
  async getInfo(): Promise<Result> {
    return result.okData({
      info: await this.redisCache.getInfo(),
      dbSize: await this.redisCache.getKeySize(),
      commandStats: await this.redisCache.getCommandStats(),
    });
  }

  /**
   * 缓存名称列表
   *
   * @returns 返回结果
   */
  @Get('/getNames')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async getNames(): Promise<Result> {
    const caches: SysCache[] = [
      new SysCache().newNames('用户信息', CACHE_LOGIN_TOKEN),
      new SysCache().newNames('配置信息', CACHE_SYS_CONFIG),
      new SysCache().newNames('数据字典', CACHE_SYS_DICT),
      new SysCache().newNames('验证码', CACHE_CAPTCHA_CODE),
      new SysCache().newNames('防重提交', CACHE_REPEAT_SUBMIT),
      new SysCache().newNames('限流处理', CACHE_RATE_LIMIT),
      new SysCache().newNames('密码错误次数', CACHE_PWD_ERR_COUNT),
    ];
    return result.okData(caches);
  }

  /**
   * 缓存名称下键名列表
   * @param cacheName 缓存名称列表中得到的缓存名称
   * @returns 返回结果
   */
  @Get('/getKeys/:cacheName')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async getKeys(@Param('cacheName') cacheName: string): Promise<Result> {
    if (!cacheName) return result.err();
    const cacheKeys = await this.redisCache.getKeys(`${cacheName}:*`);
    const rows = [];
    if (cacheKeys && cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        rows.push(new SysCache().newKeys(cacheName, key));
      }
    }
    return result.okData(rows);
  }

  /**
   * 缓存内容
   * @param cacheName 键名列表中得到的缓存名称
   * @param cacheKey 键名列表中得到的缓存键名
   * @returns 返回结果
   */
  @Get('/getValue/:cacheName/:cacheKey')
  @PreAuthorize({ hasPermissions: ['monitor:cache:query'] })
  async getValue(
    @Param('cacheName') cacheName: string,
    @Param('cacheKey') cacheKey: string
  ): Promise<Result> {
    if (!cacheName || !cacheKey) return result.err();
    const cacheValue = await this.redisCache.get(`${cacheName}:${cacheKey}`);
    const sysCache = new SysCache().newValue(cacheName, cacheKey, cacheValue);
    return result.okData(sysCache);
  }

  /**
   * 删除缓存名称下键名列表
   * @param cacheName 缓存名称列表中得到的缓存名称
   * @returns 返回结果
   */
  @Del('/clearCacheName/:cacheName')
  @PreAuthorize({ hasPermissions: ['monitor:cache:remove'] })
  async clearCacheName(@Param('cacheName') cacheName: string): Promise<Result> {
    if (!cacheName) return result.err();
    const cacheKeys = await this.redisCache.getKeys(`${cacheName}*`);
    const num = await this.redisCache.delKeys(cacheKeys);
    return result[num > 0 ? 'ok' : 'err']();
  }

  /**
   * 删除缓存键名
   * @param cacheName 键名列表中得到的缓存名称
   * @param cacheKey 键名列表中得到的缓存键名
   * @returns 返回结果
   */
  @Del('/clearCacheKey/:cacheName/:cacheKey')
  @PreAuthorize({ hasPermissions: ['monitor:cache:remove'] })
  async clearCacheKey(
    @Param('cacheName') cacheName: string,
    @Param('cacheKey') cacheKey: string
  ): Promise<Result> {
    if (!cacheName || !cacheKey) return result.err();
    const num = await this.redisCache.del(cacheName + ':' + cacheKey);
    return result[num > 0 ? 'ok' : 'err']();
  }

  /**
   * 安全清理缓存名称
   *
   * 指定可清理的缓存key
   * @returns 返回结果
   */
  @Del('/clearCacheSafe')
  @PreAuthorize({ hasPermissions: ['monitor:cache:remove'] })
  async clearCacheSafe(): Promise<Result> {
    // 指定清除的缓存列表
    const caches: SysCache[] = [
      new SysCache().newNames('配置信息', CACHE_SYS_CONFIG),
      new SysCache().newNames('数据字典', CACHE_SYS_DICT),
      new SysCache().newNames('验证码', CACHE_CAPTCHA_CODE),
      new SysCache().newNames('防重提交', CACHE_REPEAT_SUBMIT),
      new SysCache().newNames('限流处理', CACHE_RATE_LIMIT),
      new SysCache().newNames('密码错误次数', CACHE_PWD_ERR_COUNT),
    ];
    for (const v of caches) {
      const cacheKeys = await this.redisCache.getKeys(`${v.cacheName}:*`);
      await this.redisCache.delKeys(cacheKeys);
    }
    return result.ok();
  }
}
