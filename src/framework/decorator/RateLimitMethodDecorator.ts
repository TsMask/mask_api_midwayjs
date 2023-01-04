import { REQUEST_OBJ_CTX_KEY } from '@midwayjs/core';
import { createCustomMethodDecorator, JoinPoint } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { LoginUser } from '../model/LoginUser';
import { Result } from '../model/Result';
import { LimitTypeEnum } from '../enums/LimitTypeEnum';
import { RATE_LIMIT_KEY } from '../constants/CacheKeysConstants';
import { RedisCache } from '../cache/RedisCache';
import { IP_INNER_ADDR } from '../constants/CommonConstants';

/** 限流参数 */
interface rateLimitOptions {
  /**限流时间,单位秒 */
  time: number;
  /**限流次数 */
  count: number;
  /**限流条件类型 */
  limitType?: LimitTypeEnum;
}

/**装饰器内部的唯一 key */
export const DECORATOR_METHOD_RATE_LIMIT_KEY = 'decorator_method:rate_limit';

/**
 * 限流-方法装饰器
 *
 * 示例参数：`{ time: 5, count: 10, limitType: LimitTypeEnum.IP }`
 *
 * 参数表示：5秒内，最多请求10次，类型记录IP
 *
 * 使用 `LimitTypeEnum.USER` 时，请在用户身份授权认证校验后使用
 * 以便获取登录用户信息，无用户信息时默认为 `LimitTypeEnum.GLOBAL`
 * @param options 限流参数
 * @author TsMask <340112800@qq.com>
 */
export function RateLimit(options: rateLimitOptions): MethodDecorator {
  return createCustomMethodDecorator(DECORATOR_METHOD_RATE_LIMIT_KEY, options);
}

/**
 * 实现装饰器-请求限流
 * @param options.metadata 方法装饰器参数
 * @returns 返回结果
 */
export function RateLimitVerify(options: { metadata: rateLimitOptions }) {
  return {
    around: async (joinPoint: JoinPoint) => {
      // 装饰器所在的实例上下文
      const ctx: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];
      // 初始可选参数数据
      const metadataObj = options.metadata;
      if (!metadataObj.limitType) {
        metadataObj.limitType = LimitTypeEnum.GLOBAL;
      }

      // 默认
      const className = joinPoint.target.constructor.name;
      const classMethod = `${className}.${joinPoint.methodName}()`;
      let combinedKey = RATE_LIMIT_KEY + classMethod;

      // IP
      if (metadataObj.limitType === LimitTypeEnum.IP) {
        const clientIP = ctx.ip.includes(IP_INNER_ADDR)
          ? IP_INNER_ADDR
          : ctx.ip;
        combinedKey = RATE_LIMIT_KEY + `${clientIP}:${classMethod}`;
      }

      // 用户
      if (metadataObj.limitType === LimitTypeEnum.USER) {
        const loginUser: LoginUser = ctx.loginUser;
        if (loginUser && loginUser.userId) {
          combinedKey =
            RATE_LIMIT_KEY + `${loginUser.user.userId}:${classMethod}`;
        }
      }

      // 在Redis查询并记录请求次数
      const redisCache: RedisCache = await ctx.requestContext.getAsync(
        RedisCache
      );
      const rateCount = await redisCache.rateLimit(
        combinedKey,
        metadataObj.time,
        metadataObj.count
      );
      if (rateCount >= metadataObj.count) {
        return Result.errMsg('访问过于频繁，请稍候再试');
      }

      // 执行原方法
      return await joinPoint.proceed(...joinPoint.args);
    },
  };
}
