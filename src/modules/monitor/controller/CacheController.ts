import { Controller, Inject, Get, Param, Del } from '@midwayjs/decorator';
import {
  CAPTCHA_CODE_KEY,
  LOGIN_TOKEN_KEY,
  PWD_ERR_CNT_KEY,
  RATE_LIMIT_KEY,
  REPEAT_SUBMIT_KEY,
  SYS_CONFIG_KEY,
  SYS_DICT_KEY,
} from '../../../common/constants/CacheKeysConstants';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { RedisCache } from '../../../framework/redis/RedisCache';
import { SysCache } from '../model/SysCache';

/**
 * 缓存监控信息
 *
 * @author TsMask <340112800@qq.com>
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
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async info(): Promise<Result> {
    return Result.okData({
      info: {},
      dbSize: {},
      commandStats: {},
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
    const caches: SysCache[] = [];
    caches.push(new SysCache().newCacheNR(LOGIN_TOKEN_KEY, '用户信息'));
    caches.push(new SysCache().newCacheNR(SYS_CONFIG_KEY, '配置信息'));
    caches.push(new SysCache().newCacheNR(SYS_DICT_KEY, '数据字典'));
    caches.push(new SysCache().newCacheNR(CAPTCHA_CODE_KEY, '验证码'));
    caches.push(new SysCache().newCacheNR(REPEAT_SUBMIT_KEY, '防重提交'));
    caches.push(new SysCache().newCacheNR(RATE_LIMIT_KEY, '限流处理'));
    caches.push(new SysCache().newCacheNR(PWD_ERR_CNT_KEY, '密码错误次数'));
    return Result.okData(caches);
  }

  /**
   * 缓存名称下键名列表
   * @param cacheName 缓存名称
   * @returns 返回结果
   */
  @Get('/getKeys/:cacheName')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async getKeys(@Param('cacheName') cacheName: string): Promise<Result> {
    const cacheKeys = await this.redisCache.getKeys(`${cacheName}*`);
    return Result.okData(cacheKeys);
  }

  /**
   * 缓存内容
   * @param cacheName 缓存名称
   * @param cacheKey 缓存键名
   * @returns 返回结果
   */
  @Get('/getValue/:cacheName/:cacheKey')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async getValue(
    @Param('cacheName') cacheName: string,
    @Param('cacheKey') cacheKey: string
  ): Promise<Result> {
    const cacheValue = await this.redisCache.get(cacheKey);
    return Result.okData(
      new SysCache().newCacheNKV(cacheName, cacheKey, cacheValue)
    );
  }

  /**
   * 删除缓存名称下键名列表
   * @param cacheName 缓存名称
   * @returns 返回结果
   */
  @Del('/clearCacheName/:cacheName')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async clearCacheName(@Param('cacheName') cacheName: string): Promise<Result> {
    const cacheKeys = await this.redisCache.getKeys(`${cacheName}*`);
    await this.redisCache.delKeys(cacheKeys);
    return Result.ok();
  }

  /**
   * 删除缓存键名
   * @param cacheKey 缓存名称
   * @returns 返回结果
   */
  @Del('/clearCacheKey/:cacheKey')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async clearCacheKey(@Param('cacheKey') cacheKey: string): Promise<Result> {
    await this.redisCache.del(cacheKey);
    return Result.ok();
  }

  /**
   * 清除全部缓存key
   * @returns 返回结果
   */
  @Del('/clearCacheAll')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async clearCacheAll(): Promise<Result> {
    const cacheKeys = await this.redisCache.getKeys('*');
    await this.redisCache.delKeys(cacheKeys);
    return Result.ok();
  }
}
