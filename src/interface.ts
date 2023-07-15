import '@midwayjs/core';
import { LoginUser } from './framework/vo/LoginUser';

/**扩展 Midway 通用的 Context */
declare module '@midwayjs/core' {
  interface Context {
    /**登录用户身份权限信息 */
    loginUser: LoginUser;
  }
}

/**扩展 midwayjs/redis 声明自定义脚本命令  */
declare module '@midwayjs/redis' {
  interface RedisService {
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
