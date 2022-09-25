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
  private redis_service: RedisService;

  /**
   * 设置缓存数据
   *
   * @param key 键
   * @param value 值
   * @return 成功返回 "OK"
   */
  async set(key: string, value: string | Buffer | number): Promise<string> {
    return await this.redis_service.set(key, value);
  }

  /**
   * 设置缓存数据与过期时间
   *
   * @param key 键
   * @param value 值
   * @param timeout 有效时间，单位秒
   * @return 成功返回 "OK"
   */
  async set_by_timeout(
    key: string,
    value: string | Buffer | number,
    timeout: number
  ): Promise<string> {
    return await this.redis_service.set(key, value, 'EX', timeout);
  }

  /**
   * 设置有效时间
   *
   * @param key 键
   * @param timeout 超时时间, 单位秒
   * @return true=设置成功 false=设置失败
   */
  async set_expire(key: string, timeout: string | number): Promise<boolean> {
    const key_num = await this.redis_service.expire(key, timeout);
    return key_num > 0;
  }

  /**
   * 获取有效时间
   *
   * @param key 键
   * @return key剩余有效期，单位秒
   */
  async get_expire(key: string): Promise<number> {
    return await this.redis_service.ttl(key);
  }

  /**
   * 判断key是否存在
   *
   * @param key 键
   * @return true=存在 false=不存在
   */
  async has_key(key: string): Promise<boolean> {
    const key_num = await this.redis_service.exists(key);
    return key_num > 0;
  }

  /**
   * 删除单个
   *
   * @param key 键
   * @return 删除key数量
   */
  async del(key: string): Promise<number> {
    return await this.redis_service.del(key);
  }

  /**
   * 删除多个
   *
   * @param keys 多个键
   * @return 删除key数量
   */
  async del_keys(keys: string[]): Promise<number> {
    return await this.redis_service.del(keys);
  }

  /**
   * 获得缓存数据
   *
   * @param key 缓存的键值
   * @return 缓存键值对应的数据
   */
  async get(key: string): Promise<string> {
    return await this.redis_service.get(key);
  }

  /**
   * 获得缓存数据的key列表
   *
   * @param pattern 字符串前缀 例如：sys_*
   * @return key列表
   */
  async get_keys(pattern: string = "*"): Promise<string[]> {
    return await this.redis_service.keys(pattern);
  }
}
