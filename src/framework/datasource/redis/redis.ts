import { Provide, Inject, Singleton } from '@midwayjs/core';
import { Redis, RedisServiceFactory } from '@midwayjs/redis';

/**Redis连接实例 */
@Provide()
@Singleton()
export class RedisCache {
  @Inject()
  private redisServiceFactory: RedisServiceFactory;

  /**定义Lua脚本标记，避免重复定义 */
  private defineCommand: Record<string, string[]> = {};

  /**
   * 获取实例
   * @param source redis服务标识，默认为default
   * @returns redis实例
   */
  public async rdb(source: string): Promise<Redis> {
    if (!source) {
      source = 'default';
    }
    return await this.redisServiceFactory.get(source);
  }

  /**
   * 获取redis服务信息
   * @param source 数据源名称，空字符值默认为default
   * @returns 信息对象
   */
  public async info(
    source: string
  ): Promise<Record<string, Record<string, string>>> {
    const rdb = await this.rdb(source);
    const info = await rdb.info();
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
   * 获取redis当前连接可用键Key总数信息
   * @param source 数据源名称，空字符值默认为default
   * @return key总数
   */
  public async keySize(source: string): Promise<number> {
    const rdb = await this.rdb(source);
    return await rdb.dbsize();
  }

  /**
   * 获取redis命令状态信息
   * @param source 数据源名称，空字符值默认为default
   * @return 命令状态列表
   */
  public async commandStats(source: string): Promise<Record<string, string>[]> {
    const rdb = await this.rdb(source);
    const commandstats = await rdb.info('commandstats');
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
   * 判断key是否存在
   * @param source 数据源名称，空字符值默认为default
   * @param key 键
   * @return 存在数量
   */
  public async has(source: string, key: string): Promise<number> {
    const rdb = await this.rdb(source);
    return await rdb.exists(key);
  }

  /**
   * 设置过期时间（秒）
   * @param source 数据源名称，空字符值默认为default
   * @param key 键
   * @param seconds 有效时间，单位秒
   * @return key剩余有效期，单位秒
   */
  public async setExpire(
    source: string,
    key: string,
    seconds: number
  ): Promise<number> {
    const rdb = await this.rdb(source);
    return await rdb.expire(key, seconds);
  }

  /**
   * 获取键的剩余有效时间（秒）
   * @param source 数据源名称，空字符值默认为default
   * @param key 键
   * @return key剩余有效期，单位秒
   */
  public async getExpire(source: string, key: string): Promise<number> {
    const rdb = await this.rdb(source);
    return await rdb.ttl(key);
  }

  /**
   * 获得缓存数据的key列表
   * @param source 数据源名称，空字符值默认为default
   * @param pattern 键
   * @return key列表
   */
  public async getKeys(source: string, pattern: string): Promise<string[]> {
    // 数据源
    const rdb = await this.rdb(source);
    // return await rdb.keys(pattern);
    const keys: string[] = [];
    // 游标
    let cursor = '0';
    const count = 100;
    // 循环遍历获取匹配的键
    for (;;) {
      // 使用 SCAN 命令获取匹配的键
      const [nextCursor, batchKeys] = await rdb.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        count
      );
      cursor = nextCursor;
      keys.push(...batchKeys);
      // 当 cursor 为 0，表示遍历完成
      if (cursor === '0') {
        break;
      }
    }
    return keys;
  }

  /**
   * 批量获得缓存数据
   * @param source 数据源名称，空字符值默认为default
   * @param keys 缓存的键值数组
   * @return 缓存键值对应的数据
   */
  public async getBatch(source: string, keys: string[]): Promise<string[]> {
    if (!keys || keys.length === 0) {
      return [];
    }
    const rdb = await this.rdb(source);
    const v = await rdb.mget(keys);
    if (Array.isArray(v) && v.length > 0) {
      return v;
    }
    return [];
  }

  /**
   * 获得缓存数据
   * @param source 数据源名称，空字符值默认为default
   * @param key 缓存的键值
   * @return 缓存键值对应的数据
   */
  public async get(source: string, key: string): Promise<string> {
    const rdb = await this.rdb(source);
    const v = await rdb.get(key);
    return v ?? '';
  }

  /**
   * 设置缓存数据
   * @param source 数据源名称，空字符值默认为default
   * @param key 键
   * @param value 值
   * @param seconds 有效时间，单位秒 0表示永久有效
   * @return 布尔
   */
  public async set(
    source: string,
    key: string,
    value: string | Buffer | number,
    seconds: number = 0
  ): Promise<boolean> {
    const rdb = await this.rdb(source);
    let ok = '';
    if (seconds > 0) {
      ok = await rdb.set(key, value, 'EX', seconds);
    } else {
      ok = await rdb.set(key, value);
    }
    return ok === 'OK';
  }

  /**
   * 删除单个
   * @param source 数据源名称，空字符值默认为default
   * @param key 键
   * @return 删除key数量
   */
  public async del(source: string, key: string): Promise<number> {
    const rdb = await this.rdb(source);
    return await rdb.del(key);
  }

  /**
   * 删除多个
   * @param source 数据源名称，空字符值默认为default
   * @param keys 多个键
   * @return 删除key数量
   */
  public async delKeys(source: string, keys: string[]): Promise<number> {
    if (!keys || keys.length === 0) {
      return 0;
    }
    const rdb = await this.rdb(source);
    return await rdb.del(keys);
  }

  /**
   * 限流查询并记录
   * @param source 数据源名称，空字符值默认为default
   * @param limitKey 限流缓存key
   * @param time 限流时间,单位秒
   * @param count 限流次数
   * @return 请求记录总数
   */
  public async rateLimit(
    source: string,
    limitKey: string,
    time: number,
    count: number
  ): Promise<number> {
    const rdb = await this.rdb(source);

    // 定义限流命令
    let isDefine = true;
    if (Object.hasOwn(this.defineCommand, 'rateLimitCommand')) {
      if (this.defineCommand.rateLimitCommand.indexOf(source) === -1) {
        isDefine = false;
      }
    } else {
      this.defineCommand.rateLimitCommand = [];
      isDefine = false;
    }
    if (!isDefine) {
      // 声明定义限流脚本命令
      rdb.defineCommand('rateLimitCommand', {
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
      this.defineCommand.rateLimitCommand.push(source);
    }

    return await rdb.rateLimitCommand(limitKey, time, count);
  }
}
