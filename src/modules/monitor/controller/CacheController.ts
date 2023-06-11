import { Controller, Inject, Get, Param, Del } from '@midwayjs/decorator';
import {
  CAPTCHA_CODE_KEY,
  LOGIN_TOKEN_KEY,
  PWD_ERR_CNT_KEY,
  RATE_LIMIT_KEY,
  REPEAT_SUBMIT_KEY,
  SYS_CONFIG_KEY,
  SYS_DICT_KEY,
} from '../../../framework/constants/CacheKeysConstants';
import { Result } from '../../../framework/model/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RedisCache } from '../../../framework/cache/RedisCache';
import { SysCache } from '../model/SysCache';

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
    return Result.okData({
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
    const caches: SysCache[] = [];
    caches.push(new SysCache().newNames('用户信息', LOGIN_TOKEN_KEY));
    caches.push(new SysCache().newNames('配置信息', SYS_CONFIG_KEY));
    caches.push(new SysCache().newNames('数据字典', SYS_DICT_KEY));
    caches.push(new SysCache().newNames('验证码', CAPTCHA_CODE_KEY));
    caches.push(new SysCache().newNames('防重提交', REPEAT_SUBMIT_KEY));
    caches.push(new SysCache().newNames('限流处理', RATE_LIMIT_KEY));
    caches.push(new SysCache().newNames('密码错误次数', PWD_ERR_CNT_KEY));
    return Result.okData(caches);
  }

  /**
   * 缓存名称下键名列表
   * @param cacheName 缓存名称列表中得到的缓存名称
   * @returns 返回结果
   */
  @Get('/getKeys/:cacheName')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  async getKeys(@Param('cacheName') cacheName: string): Promise<Result> {
    if (!cacheName) return Result.err();
    const cacheKeys = await this.redisCache.getKeys(`${cacheName}:*`);
    const rows = [];
    if (cacheKeys && cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        rows.push(new SysCache().newKeys(cacheName, key));
      }
    }
    return Result.okData(rows);
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
    if (!cacheName || !cacheKey) return Result.err();
    const cacheValue = await this.redisCache.get(`${cacheName}:${cacheKey}`);
    const sysCache = new SysCache().newValue(cacheName, cacheKey, cacheValue);
    return Result.okData(sysCache);
  }

  /**
   * 删除缓存名称下键名列表
   * @param cacheName 缓存名称列表中得到的缓存名称
   * @returns 返回结果
   */
  @Del('/clearCacheName/:cacheName')
  @PreAuthorize({ hasPermissions: ['monitor:cache:remove'] })
  async clearCacheName(@Param('cacheName') cacheName: string): Promise<Result> {
    if (!cacheName) return Result.err();
    const cacheKeys = await this.redisCache.getKeys(`${cacheName}*`);
    const num = await this.redisCache.delKeys(cacheKeys);
    return Result[num > 0 ? 'ok' : 'err']();
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
    if (!cacheName || !cacheKey) return Result.err();
    const num = await this.redisCache.del(cacheName + ':' + cacheKey);
    return Result[num > 0 ? 'ok' : 'err']();
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
    const keyArr = [
      SYS_CONFIG_KEY,
      SYS_DICT_KEY,
      CAPTCHA_CODE_KEY,
      REPEAT_SUBMIT_KEY,
      RATE_LIMIT_KEY,
      PWD_ERR_CNT_KEY,
    ];
    for (const key of keyArr) {
      const cacheKeys = await this.redisCache.getKeys(`${key}*`);
      await this.redisCache.delKeys(cacheKeys);
    }
    return Result.ok();
  }
}
