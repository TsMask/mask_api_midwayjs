import '@midwayjs/core';
import { Result, Callback } from "ioredis";
import { LoginUser } from './framework/core/vo/LoginUser';

/**扩展 Midway 通用的 Context */
declare module '@midwayjs/core' {
  interface Context {
    /**登录用户身份权限信息 */
    loginUser: LoginUser;
  }
}

/**在 ioredis 声明自定义脚本命令  */
declare module "ioredis" {
  interface RedisCommander<Context> {
    /**
     * 限流Lua命令
     * @param key 限流缓存key
     * @param count 限流次数
     * @param time 限流时间,单位秒
     * @param callback 回调函数
     */
    rateLimitCommand(
      key: string,
      count: number,
      time: number,
      callback?: Callback<number>
    ): Result<number, Context>;
  }
}