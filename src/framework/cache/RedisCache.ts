import { Provide, Inject, Singleton, Init } from '@midwayjs/decorator';
import { RedisService } from '@midwayjs/redis';

/**
 * redis 缓存处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class RedisCache {
  @Inject()
  private redisService: RedisService;

  @Init()
  async init() {
    // 启动时，声明定义限流脚本命令
    this.redisService.defineCommand('rateLimitCommand', {
      numberOfKeys: 1,
      lua: `local key = KEYS[1]
      local time = tonumber(ARGV[1])
      local count = tonumber(ARGV[2])
      local current = redis.call('get', key);
      if current and tonumber(current) >= count then
          return tonumber(current);
      end
      current = redis.call('incr', key)
      if tonumber(current) == 1 then
          redis.call('expire', key, time)
      end
      return tonumber(current);`,
    });
  }

  /**
   * 获取redis服务信息
   * @return 信息对象
   */
  async getInfo(): Promise<Record<string, Record<string, string>>> {
    const info = await this.redisService.info();
    // 处理字符串信息
    const infoObj: Record<string, Record<string, string>> = {};
    let label = '';
    const lines: string[] = info.split('\r\n');
    for (const line of lines) {
      // 记录标题节点
      if (line.includes('#')) {
        label = line.split(' ').pop().toLowerCase();
        infoObj[label] = {};
        continue;
      }
      // 节点后续键值
      const kvArr: string[] = line.split(':');
      if (kvArr.length >= 2) {
        const key: string = kvArr.shift();
        infoObj[label][key] = kvArr.pop();
      }
    }
    return infoObj;
  }

  /**
   * 获取redis命令状态信息
   * @return 命令状态列表
   */
  async getCommandStats(): Promise<Record<string, string>[]> {
    const commandstats = await this.redisService.info('commandstats');
    // 处理字符串信息
    const statsObjArr: Record<string, string>[] = [];
    const lines: string[] = commandstats.split('\r\n');
    for (const line of lines) {
      if (!line.startsWith('cmdstat_')) continue;
      const kvArr: string[] = line.split(':');
      const key: string = kvArr.shift();
      const valueStr: string = kvArr.pop();
      statsObjArr.push({
        name: key.substring(8),
        value: valueStr.substring(6, valueStr.indexOf(',usec=')),
      });
    }
    return statsObjArr;
  }

  /**
   * 获取redis当前连接可用键Key总数信息
   * @return key总数
   */
  async getKeySize(): Promise<number> {
    return await this.redisService.dbsize();
  }

  /**
   * 限流查询并记录
   * @param limitKey 限流缓存key
   * @param time 限流时间,单位秒
   * @param count 限流次数
   * @return 请求记录总数
   */
  async rateLimit(
    limitKey: string,
    time: number,
    count: number
  ): Promise<number> {
    return await this.redisService.rateLimitCommand(limitKey, time, count);
  }

  /**
   * 设置缓存数据
   *
   * @param key 键
   * @param value 值
   * @return 成功返回 "OK"
   */
  async set(key: string, value: string | Buffer | number): Promise<string> {
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
  async setByExpire(
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
  async setExpire(key: string, timeout: string | number): Promise<boolean> {
    const keys = await this.redisService.expire(key, timeout);
    return keys > 0;
  }

  /**
   * 获取有效时间
   *
   * @param key 键
   * @return key剩余有效期，单位秒
   */
  async getExpire(key: string): Promise<number> {
    return await this.redisService.ttl(key);
  }

  /**
   * 判断key是否存在
   *
   * @param key 键
   * @return true=存在 false=不存在
   */
  async hasKey(key: string): Promise<boolean> {
    const keys = await this.redisService.exists(key);
    return keys > 0;
  }

  /**
   * 删除单个
   *
   * @param key 键
   * @return 删除key数量
   */
  async del(key: string): Promise<number> {
    return await this.redisService.del(key);
  }

  /**
   * 删除多个
   *
   * @param keys 多个键
   * @return 删除key数量
   */
  async delKeys(keys: string[]): Promise<number> {
    if (!keys || keys.length === 0) {
      return 0;
    }
    return await this.redisService.del(keys);
  }

  /**
   * 获得缓存数据
   *
   * @param key 缓存的键值
   * @return 缓存键值对应的数据
   */
  async get(key: string): Promise<string> {
    return await this.redisService.get(key);
  }

  /**
   * 批量获得缓存数据
   *
   * 如果某个键不存在，则对应的元素为 null
   *
   * @param keys 缓存的键值数组
   * @return 缓存键值对应的数据
   */
  async getBatch(keys: string[]): Promise<string[]> {
    if (!keys || keys.length === 0) {
      return [];
    }
    return await this.redisService.mget(keys);
  }

  /**
   * 获得缓存数据的key列表
   *
   * @param pattern 字符串前缀 例如：sys_*
   * @return key列表
   */
  async getKeys(pattern = '*'): Promise<string[]> {
    // return await this.redisService.keys(pattern);
    const keys: string[] = [];
    let cursor = '0';

    do {
      const [nextCursor, batchKeys] = await this.redisService.scan(
        cursor,
        'MATCH',
        pattern
      );
      cursor = nextCursor;
      keys.push(...batchKeys);
    } while (cursor !== '0');

    return keys;
  }
}
