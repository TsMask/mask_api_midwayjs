import {
  JoinPoint,
  REQUEST_OBJ_CTX_KEY,
  createCustomMethodDecorator,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { CACHE_RATE_LIMIT } from '../constants/cache_key';
import { RedisCache } from '../datasource/redis/redis';
import { clientIP } from '../ip2region/ip2region';
import { loginUserToUserID } from '../reqctx/auth';
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
  type: number;
}

/**装饰器key标识-请求限流 */
export const METHOD_KEY_RATE_LIMIT = 'decorator_method:rate_limit';

/**
 * 装饰器声明-请求限流
 *
 * 示例参数：`{ time: 5, count: 10, type: LIMIT_IP }`
 *
 * 参数表示：5秒内，最多请求10次，类型记录IP
 *
 * 使用 `LIMIT_USER` 时，请在用户身份授权认证校验后使用
 * 以便获取登录用户信息，无用户信息时默认为 `LIMIT_GLOBAL`
 * @param options 限流参数
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
      const c: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];
      // 初始可选参数数据
      let time = options.metadata.time;
      if (time < 5) {
        time = 5;
      }
      let count = options.metadata.count;
      if (count < 10) {
        count = 10;
      }
      let type = options.metadata.type;
      if (type < 1 || type > 3) {
        type = LIMIT_GLOBAL;
      }

      // 获取执行函数名称
      const className = joinPoint.target.constructor.name;
      const classMethod = `${className}.${joinPoint.methodName}()`;
      // 生成限流key
      let limitKey = CACHE_RATE_LIMIT + ':' + classMethod;

      // 用户
      if (type === LIMIT_USER) {
        const loginUserId = loginUserToUserID(c);
        if (loginUserId < 0) {
          c.status = 401;
          return Resp.codeMsg(401, '无效身份授权');
        }
        limitKey = `${CACHE_RATE_LIMIT}:${loginUserId}:${classMethod}`;
      }

      // IP
      if (type === LIMIT_IP) {
        const clientIPStr = clientIP(c.ip);
        limitKey = `${CACHE_RATE_LIMIT}:${clientIPStr}:${classMethod}`;
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
        return Resp.codeMsg(4013, '访问过于频繁，请稍候再试');
      }

      // 执行原方法
      return await joinPoint.proceed(...joinPoint.args);
    },
  };
}
