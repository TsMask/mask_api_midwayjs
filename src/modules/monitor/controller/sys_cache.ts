import { Controller, Inject, Get, Del, Query } from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';

import {
  CACHE_SYS_CONFIG,
  CACHE_SYS_DICT,
  CACHE_CAPTCHA_CODE,
  CACHE_REPEAT_SUBMIT,
  CACHE_RATE_LIMIT,
  CACHE_PWD_ERR_COUNT,
  CACHE_LOGIN_TOKEN,
} from '../../../framework/constants/cache_key';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { SysCache } from '../model/sys_cache';

/**缓存信息 控制层处理 */
@Controller('/monitor/cache')
export class CacheController {
  /**缓存服务 */
  @Inject()
  private redisCache: RedisCache;

  /**Redis信息 */
  @Get()
  @PreAuthorize({ hasPermissions: ['monitor:cache:info'] })
  public async info(): Promise<Resp> {
    return Resp.okData({
      info: await this.redisCache.info(''),
      dbSize: await this.redisCache.keySize(''),
      commandStats: await this.redisCache.commandStats(''),
    });
  }

  /**缓存名称列表 */
  @Get('/names')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  public async names(): Promise<Resp> {
    const caches: SysCache[] = [
      new SysCache().newNames('用户信息', CACHE_LOGIN_TOKEN),
      new SysCache().newNames('配置信息', CACHE_SYS_CONFIG),
      new SysCache().newNames('数据字典', CACHE_SYS_DICT),
      new SysCache().newNames('验证码', CACHE_CAPTCHA_CODE),
      new SysCache().newNames('防重提交', CACHE_REPEAT_SUBMIT),
      new SysCache().newNames('限流处理', CACHE_RATE_LIMIT),
      new SysCache().newNames('密码错误次数', CACHE_PWD_ERR_COUNT),
    ];
    return Resp.okData(caches);
  }

  /**缓存名称下键名列表 */
  @Get('/keys')
  @PreAuthorize({ hasPermissions: ['monitor:cache:list'] })
  public async keys(
    @Valid(RuleType.string().required()) @Query('cacheName') cacheName: string
  ): Promise<Resp> {
    const cacheKeys = await this.redisCache.getKeys('', `${cacheName}:*`);
    const caches: SysCache[] = [];
    for (const key of cacheKeys) {
      caches.push(new SysCache().newKeys(cacheName, key));
    }
    return Resp.okData(caches);
  }

  /**缓存内容信息 */
  @Get('/value')
  @PreAuthorize({ hasPermissions: ['monitor:cache:query'] })
  public async value(
    @Valid(RuleType.string().required()) @Query('cacheName') cacheName: string,
    @Valid(RuleType.string().required()) @Query('cacheKey') cacheKey: string
  ): Promise<Resp> {
    const cacheValue = await this.redisCache.get(
      '',
      `${cacheName}:${cacheKey}`
    );
    const sysCache = new SysCache().newValue(cacheName, cacheKey, cacheValue);
    return Resp.okData(sysCache);
  }

  /**缓存名称列表安全删除 */
  @Del('/names')
  @PreAuthorize({ hasPermissions: ['monitor:cache:remove'] })
  public async cleanNames(): Promise<Resp> {
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
      const cacheKeys = await this.redisCache.getKeys('', `${v.cacheName}:*`);
      await this.redisCache.delKeys('', cacheKeys);
    }
    return Resp.ok();
  }

  /**缓存名称下键名删除 */
  @Del('/keys')
  @PreAuthorize({ hasPermissions: ['monitor:cache:remove'] })
  public async cleanKeys(
    @Valid(RuleType.string().required()) @Query('cacheName') cacheName: string
  ): Promise<Resp> {
    if (cacheName.startsWith(CACHE_LOGIN_TOKEN)) {
      return Resp.errMsg('不能删除用户信息缓存');
    }
    const cacheKeys = await this.redisCache.getKeys('', `${cacheName}:*`);
    const num = await this.redisCache.delKeys('', cacheKeys);
    if (num > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**缓存内容删除 */
  @Del('/value')
  @PreAuthorize({ hasPermissions: ['monitor:cache:remove'] })
  public async clearCacheKey(
    @Valid(RuleType.string().required()) @Query('cacheName') cacheName: string,
    @Valid(RuleType.string().required()) @Query('cacheKey') cacheKey: string
  ): Promise<Resp> {
    const num = await this.redisCache.del('', cacheName + ':' + cacheKey);
    if (num > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }
}
