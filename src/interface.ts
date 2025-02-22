import '@midwayjs/core';

/**扩展 midwayjs/redis 声明自定义脚本命令  */
declare module '@midwayjs/redis' {
  interface Redis {
    /**
     * 限流Lua命令
     * @param key 限流缓存key
     * @param time 限流时间,单位秒
     * @param count 限流次数
     * @param callback 回调函数 (error, number)
     */
    rateLimitCommand(key: string, time: number, count: number): Promise<number>;
  }
}
