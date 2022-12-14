import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { RedisService } from '@midwayjs/redis';

/**
 * redis 缓存处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class RedisCache {
  @Inject()
  private redisService: RedisService;

  /**
   * 设置缓存数据
   *
   * @param key 键
   * @param value 值
   * @return 成功返回 "OK"
   */
  public async set(
    key: string,
    value: string | Buffer | number
  ): Promise<string> {
    return await this.redisService.set(key, value);
  }

  /**
   * 设置缓存数据与过期时间
   *
   * @param key 键
   * @param value 值
   * @param timeout 有效时间，单位秒
   * @return 成功返回 "OK"
   */
  public async setByExpire(
    key: string,
    value: string | Buffer | number,
    timeout: number
  ): Promise<string> {
    return await this.redisService.set(key, value, 'EX', timeout);
  }

  /**
   * 设置有效时间
   *
   * @param key 键
   * @param timeout 超时时间, 单位秒
   * @return true=设置成功 false=设置失败
   */
  public async setExpire(
    key: string,
    timeout: string | number
  ): Promise<boolean> {
    const keys = await this.redisService.expire(key, timeout);
    return keys > 0;
  }

  /**
   * 获取有效时间
   *
   * @param key 键
   * @return key剩余有效期，单位秒
   */
  public async getExpire(key: string): Promise<number> {
    return await this.redisService.ttl(key);
  }

  /**
   * 判断key是否存在
   *
   * @param key 键
   * @return true=存在 false=不存在
   */
  public async hasKey(key: string): Promise<boolean> {
    const keys = await this.redisService.exists(key);
    return keys > 0;
  }

  /**
   * 删除单个
   *
   * @param key 键
   * @return 删除key数量
   */
  public async del(key: string): Promise<number> {
    return await this.redisService.del(key);
  }

  /**
   * 删除多个
   *
   * @param keys 多个键
   * @return 删除key数量
   */
  public async delKeys(keys: string[]): Promise<number> {
    if (keys.length <= 0) return 0;
    return await this.redisService.del(keys);
  }

  /**
   * 获得缓存数据
   *
   * @param key 缓存的键值
   * @return 缓存键值对应的数据
   */
  public async get(key: string): Promise<string> {
    return await this.redisService.get(key);
  }

  /**
   * 获得缓存数据的key列表
   *
   * @param pattern 字符串前缀 例如：sys_*
   * @return key列表
   */
  public async getKeys(pattern = '*'): Promise<string[]> {
    return await this.redisService.keys(pattern);
  }
}
