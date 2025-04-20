import {
  IMiddleware,
  Middleware,
  MidwayWebRouterService,
  createMiddleware,
} from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

import { CACHE_RATE_LIMIT } from '../constants/cache_key';
import { loginUserToUserID } from '../reqctx/auth';
import { RedisCache } from '../datasource/redis/redis';
import { clientIP } from '../ip2region/ip2region';
import { Resp } from '../resp/api';
import { md5 } from '../utils/crypto/hash';

/**默认策略全局限流 */
export const LIMIT_GLOBAL = 1;

/**根据请求者IP进行限流 */
export const LIMIT_IP = 2;

/**根据用户ID进行限流 */
export const LIMIT_USER = 3;

/** 限流参数 */
interface RateLimitOptions {
  /**限流时间,单位秒 */
  time: number;
  /**限流次数 */
  count: number;
  /**限流条件类型 */
  type: number;
}

/**请求限流-中间件 */
@Middleware()
export class RateLimit implements IMiddleware<Context, NextFunction> {
  resolve(x: any, options: RateLimitOptions) {
    return async (c: Context, next: NextFunction) => {
      // 初始可选参数数据
      let time = options.time;
      if (time < 5) {
        time = 5;
      }
      let count = options.count;
      if (count < 10) {
        count = 10;
      }
      let type = options.type;
      if (type < 1 || type > 3) {
        type = LIMIT_GLOBAL;
      }

      // 获取执行函数名称
      const routerService = await c.requestContext.getAsync(
        MidwayWebRouterService
      );
      const routerInfo = await routerService.getMatchedRouterInfo(
        c.path,
        c.method
      );
      const funcName = routerInfo.funcHandlerName;
      // 生成限流key
      let limitKey = `${CACHE_RATE_LIMIT}:${md5(funcName)}`;

      // 用户
      if (type === LIMIT_USER) {
        const loginUserId = loginUserToUserID(c);
        if (loginUserId < 0) {
          c.status = 401;
          return Resp.codeMsg(401002, 'invalid login user information');
        }
        const funcMd5 = md5(`${loginUserId}:${funcName}`);
        limitKey = `${CACHE_RATE_LIMIT}:${funcMd5}`;
      }

      // IP
      if (type === LIMIT_IP) {
        const funcMd5 = md5(`${clientIP(c.ip)}:${funcName}`);
        limitKey = `${CACHE_RATE_LIMIT}:${funcMd5}`;
      }

      // 在Redis查询并记录请求次数
      const redisCacheServer: RedisCache = await c.requestContext.getAsync(
        RedisCache
      );
      const rateCount = await redisCacheServer.rateLimit(
        '',
        limitKey,
        time,
        count
      );
      const rateTime = await redisCacheServer.getExpire('', limitKey);

      // 设置限流声明响应头
      c.set('X-Ratelimit-Limit', `${count}`); // 总请求数限制
      c.set('X-Ratelimit-Remaining', `${count - rateCount}`); // 剩余可用请求数
      c.set('X-Ratelimit-Reset', `${Date.now() + rateTime * 1000}`); // 重置时间戳

      if (rateCount >= count) {
        c.status = 200;
        return Resp.errMsg('访问过于频繁，请稍候再试');
      }

      // 调用下一个处理程序
      return await next();
    };
  }

  static getName(): string {
    return 'RATE_LIMIT';
  }
}

/**
 * 请求限流-中间件
 *
 * 示例参数：`{ time: 5, count: 10, type: LIMIT_IP }`
 *
 * 参数表示：5秒内，最多请求10次，类型记录IP
 *
 * 使用 `LIMIT_USER` 时，请在用户身份授权认证校验后使用
 * 以便获取登录用户信息，无用户信息时默认为 `LIMIT_GLOBAL`
 * @param options 限流参数
 */
export function RateLimitMiddleware(options: RateLimitOptions) {
  return createMiddleware(RateLimit, options, RateLimit.getName());
}
