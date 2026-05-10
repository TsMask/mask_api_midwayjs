import { Provide, Inject, Singleton } from '@midwayjs/core';
import { Redis, RedisServiceFactory } from '@midwayjs/redis';

/** Redis连接实例 */
@Provide()
@Singleton()
export class RedisCache {
  @Inject()
  private redisServiceFactory: RedisServiceFactory;

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
   * @param source 数据源名称，空字符串值默认为default
   * @returns 信息对象
   */
  public async info(
    source: string
  ): Promise<Record<string, Record<string, string>>> {
    const infoObj: Record<string, Record<string, string>> = {};
    const rdb = await this.rdb(source);
    if (!rdb) return infoObj;

    const info = await rdb.info();
    let label = '';
    const lines: string[] = info.split('\r\n');
    for (const line of lines) {
      // 记录标题节点
      if (line.includes('#')) {
        const fields = line.split(' ');
        label = fields[fields.length - 1].toLowerCase();
        infoObj[label] = {};
        continue;
      }
      // 节点后续键值
      const kvArr: string[] = line.split(':');
      if (kvArr.length >= 2) {
        const key: string = kvArr[0].trim();
        const value: string = kvArr[kvArr.length - 1].trim();
        infoObj[label][key] = value;
      }
    }
    return infoObj;
  }

  /**
   * 获取redis当前连接可用键Key总数信息
   * @param source 数据源名称，空字符串值默认为default
   * @return key总数
   */
  public async keySize(source: string): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;
    return await rdb.dbsize();
  }

  /**
   * 获取redis命令状态信息
   * @param source 数据源名称，空字符串值默认为default
   * @return 命令状态列表
   */
  public async commandStats(source: string): Promise<Record<string, string>[]> {
    const statsObjArr: Record<string, string>[] = [];
    const rdb = await this.rdb(source);
    if (!rdb) return statsObjArr;

    const commandstats = await rdb.info('commandstats');
    const lines: string[] = commandstats.split('\r\n');
    for (const line of lines) {
      if (!line.startsWith('cmdstat_')) continue;
      const kvArr: string[] = line.split(':');
      const key: string = kvArr[0];
      const valueStr: string = kvArr[kvArr.length - 1];
      statsObjArr.push({
        name: key.substring(8),
        value: valueStr.substring(6, valueStr.indexOf(',usec=')),
      });
    }
    return statsObjArr;
  }

  /**
   * 判断key是否存在
   * @param source 数据源名称，空字符串值默认为default
   * @param keys 键（支持多个）
   * @return 存在数量
   */
  public async has(source: string, ...keys: string[]): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;
    return await rdb.exists(keys);
  }

  /**
   * 设置过期时间（秒）
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @param seconds 有效时间，单位秒
   * @return key剩余有效期限，单位秒
   */
  public async setExpire(
    source: string,
    key: string,
    seconds: number
  ): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;
    return await rdb.expire(key, seconds);
  }

  /**
   * 获取键的剩余有效时间（秒）
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @return key剩余有效期限，单位秒
   */
  public async getExpire(source: string, key: string): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return -2;
    return await rdb.ttl(key);
  }

  /**
   * 获得缓存数据的key列表
   * @param source 数据源名称，空字符串值默认为default
   * @param pattern 键
   * @return key列表
   */
  public async getKeys(source: string, pattern: string): Promise<string[]> {
    const keys: string[] = [];
    const rdb = await this.rdb(source);
    if (!rdb) return keys;

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
   * @param source 数据源名称，空字符串值默认为default
   * @param keys 缓存的键值数组
   * @return 缓存键值对应的数据
   */
  public async getBatch(source: string, keys: string[]): Promise<string[]> {
    if (!keys || keys.length === 0) {
      return [];
    }
    const rdb = await this.rdb(source);
    if (!rdb) return [];

    const v = await rdb.mget(keys);
    if (Array.isArray(v) && v.length > 0) {
      return v.map(item =>
        item === null || item === undefined ? '' : String(item)
      );
    }
    return [];
  }

  /**
   * 获得缓存数据
   * @param source 数据源名称，空字符串值默认为default
   * @param key 缓存的键值
   * @return 缓存键值对应的数据
   */
  public async get(source: string, key: string): Promise<string> {
    const rdb = await this.rdb(source);
    if (!rdb) return '';
    const v = await rdb.get(key);
    return v ?? '';
  }

  /**
   * 设置缓存数据
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @param value 值
   * @param seconds 有效时间，单位秒 0表示永久有效
   * @return 布尔
   */
  public async set(
    source: string,
    key: string,
    value: string | Buffer | number,
    seconds = 0
  ): Promise<boolean> {
    const rdb = await this.rdb(source);
    if (!rdb) return false;

    let ok: string;
    if (seconds > 0) {
      ok = await rdb.set(key, value, 'EX', seconds);
    } else {
      ok = await rdb.set(key, value);
    }
    return ok === 'OK';
  }

  /**
   * 删除单个
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @return 删除key数量
   */
  public async del(source: string, key: string): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;
    return await rdb.del(key);
  }

  /**
   * 原子获取并删除键（MULTI事务）
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @return 键对应的值
   */
  public async getDel(source: string, key: string): Promise<string> {
    const rdb = await this.rdb(source);
    if (!rdb) return '';

    // MULTI/EXEC 原子执行 GET + DEL，防止并发重复消费
    const results = await rdb.multi().get(key).del(key).exec();
    if (!results || results.length < 2) return '';

    // ioredis exec() returns [Error | null, Result][]
    const [getError, getResult] = results[0];
    if (getError) return '';
    return (getResult as string) ?? '';
  }

  /**
   * 原子递增
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @return 递增后的值
   */
  public async incr(source: string, key: string): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;
    return await rdb.incr(key);
  }

  /**
   * 原子递增，首次创建时设置过期时间（MULTI事务）
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @param expireSeconds 过期秒数
   * @return 递增后的值
   */
  public async incrWithExpire(
    source: string,
    key: string,
    expireSeconds: number
  ): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;

    // MULTI/EXEC 原子执行 INCR + EXPIRE，防止 INCR 成功但 EXPIRE 失败导致 key 永不过期
    const results = await rdb
      .multi()
      .incr(key)
      .expire(key, expireSeconds)
      .exec();
    if (!results || results.length < 2) return 0;

    // ioredis exec() returns [Error | null, Result][]
    const [incrErr, incrResult] = results[0];
    if (incrErr) return 0;
    return Number(incrResult);
  }

  /**
   * 仅当key存在且有过期时间时更新值，保留原TTL（MULTI事务）
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @param value 值
   * @return 原TTL秒数，-2表示key不存在，-1表示key无过期时间
   */
  public async setWithExistingTTL(
    source: string,
    key: string,
    value: string | Buffer | number
  ): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return -2;

    // 先读取 TTL 判断 key 状态
    const ttl = await rdb.ttl(key);

    // key 不存在
    if (ttl === -2) return -2;

    // key 存在但无过期时间
    if (ttl === -1) return -1;

    // MULTI/EXEC 原子执行 SET + 保留原 TTL，避免 TTL 竞争
    const ttlMs = await rdb.pttl(key);
    await rdb.multi().set(key, value, 'PX', ttlMs).exec();

    return ttl;
  }

  /**
   * 获得Hash缓存map
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @return Hash所有字段与值
   */
  public async hGetAll(
    source: string,
    key: string
  ): Promise<Record<string, string>> {
    const rdb = await this.rdb(source);
    if (!rdb) return {};
    return await rdb.hgetall(key);
  }

  /**
   * 获得Hash缓存中字段值
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @param field 字段
   * @return 字段值
   */
  public async hGet(
    source: string,
    key: string,
    field: string
  ): Promise<string> {
    const rdb = await this.rdb(source);
    if (!rdb) return '';
    const v = await rdb.hget(key, field);
    return v ?? '';
  }

  /**
   * 设置Hash缓存
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @param field 字段
   * @param value 值
   * @return 新增字段数量（已有字段更新返回0）
   */
  public async hSet(
    source: string,
    key: string,
    field: string,
    value: string | number
  ): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;
    return await rdb.hset(key, field, value);
  }

  /**
   * 判断Hash缓存中字段是否存在
   * @param source 数据源名称，空字符串值默认为default
   * @param key 键
   * @param field 字段
   * @return 是否存在
   */
  public async hExists(
    source: string,
    key: string,
    field: string
  ): Promise<boolean> {
    const rdb = await this.rdb(source);
    if (!rdb) return false;
    const num = await rdb.hexists(key, field);
    return num === 1;
  }

  /**
   * 删除多个
   * @param source 数据源名称，空字符串值默认为default
   * @param keys 多个键
   * @return 删除key数量
   */
  public async delKeys(source: string, keys: string[]): Promise<number> {
    if (!keys || keys.length === 0) {
      return 0;
    }
    const rdb = await this.rdb(source);
    if (!rdb) return 0;
    return await rdb.del(keys);
  }

  /**
   * 限流计数（MULTI/EXEC 原子执行 INCR + EXPIRE）
   * @param source 数据源名称，空字符串值默认为default
   * @param limitKey 限流缓存key
   * @param time 限流时间,单位秒
   * @return 请求记录总数
   */
  public async rateLimit(
    source: string,
    limitKey: string,
    time: number,
  ): Promise<number> {
    const rdb = await this.rdb(source);
    if (!rdb) return 0;

    // MULTI/EXEC 原子执行 INCR + EXPIRE
    const results = await rdb
      .multi()
      .incr(limitKey)
      .expire(limitKey, time)
      .exec();
    if (!results || results.length < 2) return 0;

    // ioredis exec() returns [Error | null, Result][]
    const [incrErr, incrResult] = results[0];
    const [expireErr] = results[1];

    if (incrErr || expireErr) {
      return 0;
    }

    return Number(incrResult);
  }
}
