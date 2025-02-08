import {
  JoinPoint,
  REQUEST_OBJ_CTX_KEY,
  createCustomMethodDecorator,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { CACHE_RATE_LIMIT } from '../constants/cache_key';
import { RedisCache } from '../datasource/redis/redis';
import { clientIP } from '../ip2region/ip2region';
import { Resp } from '../resp/api';

/**默认策略全局限流 */
export const LIMIT_GLOBAL = 1;

/**根据请求者IP进行限流 */
export const LIMIT_IP = 2;

/**根据用户ID进行限流 */
export const LIMIT_USER = 3;

/** 限流参数 */
interface rateLimitOptions {
  /**限流时间,单位秒 */
  time: number;
  /**限流次数 */
  count: number;
  /**限流条件类型 */
  limitType?: 1 | 2 | 3;
}

/**装饰器key标识-请求限流 */
export const METHOD_KEY_RATE_LIMIT = 'decorator_method:rate_limit';

/**
 * 装饰器声明-请求限流
 *
 * 示例参数：`{ time: 5, count: 10, limitType:  LIMIT_IP }`
 *
 * 参数表示：5秒内，最多请求10次，类型记录IP
 *
 * 使用 `LimitTypeEnum.USER` 时，请在用户身份授权认证校验后使用
 * 以便获取登录用户信息，无用户信息时默认为 `LimitTypeEnum.GLOBAL`
 * @param options 限流参数
 * @author TsMask
 */
export function RateLimit(options: rateLimitOptions): MethodDecorator {
  return createCustomMethodDecorator(METHOD_KEY_RATE_LIMIT, options);
}

/**
 * 实现装饰器-请求限流
 *
 * @param options.metadata 方法装饰器参数
 * @returns 返回结果
 */
export function RateLimitVerify(options: { metadata: rateLimitOptions }) {
  return {
    around: async (joinPoint: JoinPoint) => {
      // 装饰器所在的实例上下文
      const ctx: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];
      // 初始可选参数数据
      const limitCount = options.metadata.count;
      const limitTime = options.metadata.time;
      let limitType = options.metadata.limitType;

      const className = joinPoint.target.constructor.name;
      const classMethod = `${className}.${joinPoint.methodName}()`;
      let combinedKey = CACHE_RATE_LIMIT + ':' + classMethod;

      // 默认
      if (!limitType) {
        limitType = LIMIT_GLOBAL;
      }

      // IP
      if (limitType === LIMIT_IP) {
        const clientIPStr = clientIP(ctx.ip);
        combinedKey = CACHE_RATE_LIMIT + ':' + `${clientIPStr}:${classMethod}`;
      }

      // 用户
      if (limitType === LIMIT_USER) {
        const loginUser = ctx.loginUser;
        if (loginUser && loginUser.userId) {
          combinedKey =
            CACHE_RATE_LIMIT + ':' + `${loginUser.userId}:${classMethod}`;
        }
      }

      // 在Redis查询并记录请求次数
      const redisCacheServer: RedisCache = await ctx.requestContext.getAsync(
        RedisCache
      );
      const rateCount = await redisCacheServer.rateLimit(
        '',
        combinedKey,
        limitTime,
        limitCount
      );
      const rateTime = await redisCacheServer.getExpire('', combinedKey);

      // 设置限流声明响应头
      ctx.set('X-Ratelimit-Limit', `${limitCount}`);
      ctx.set('X-Ratelimit-Remaining', `${limitCount - rateCount}`);
      ctx.set('X-Ratelimit-Reset', `${Date.now() + rateTime * 1000}`);

      if (rateCount >= limitCount) {
        return Resp.errMsg('访问过于频繁，请稍候再试');
      }

      // 执行原方法
      return await joinPoint.proceed(...joinPoint.args);
    },
  };
}
