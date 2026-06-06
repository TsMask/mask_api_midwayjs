import {
  IMiddleware,
  Middleware,
  MidwayWebRouterService,
  createMiddleware,
} from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

import { CACHE_REPEAT_SUBMIT } from '../constants/cache_key';
import { RedisCache } from '../datasource/redis/redis';
import { clientIP } from '../ip2region/ip2region';
import { diffSeconds } from '../utils/date/data';
import { md5 } from '../utils/crypto/hash';
import { Resp } from '../resp/api';

/**递归排序对象键，保证 JSON.stringify 结果稳定 */
function sortKeys(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortKeys);
  return Object.keys(obj)
    .sort()
    .reduce((acc: Record<string, any>, key) => {
      acc[key] = sortKeys(obj[key]);
      return acc;
    }, {});
}

/**重复参数Redis格式数据类型 */
type RepeatParamType = {
  /**提交时间(时间戳)*/
  time: number;
  /**参数 */
  params: Record<string, any>;
};

/**防止表单重复提交-中间件 */
@Middleware()
export class RepeatSubmit implements IMiddleware<Context, NextFunction> {
  resolve(_: any, interval: number) {
    return async (c: Context, next: NextFunction) => {
      // 提交参数
      const params: Record<string, any> = Object.assign(
        {},
        c.request.body,
        c.request.query
      );

      // 获取执行函数名称
      const routerService = await c.requestContext.getAsync(
        MidwayWebRouterService
      );
      const routerInfo = await routerService.getMatchedRouterInfo(
        c.path,
        c.method
      );
      if (!routerInfo) {
        return await next();
      }
      const funcName = routerInfo.funcHandlerName!;
      // 唯一标识（指定key + 客户端IP + 请求地址）
      const funcMd5 = md5(`${clientIP(c.ip)}:${funcName}`);
      const cacheKey = `${CACHE_REPEAT_SUBMIT}:${funcMd5}`;

      const redisCacheServer: RedisCache =
        await c.requestContext.getAsync(RedisCache);
      const rpStr = await redisCacheServer.get('', cacheKey);
      if (rpStr) {
        try {
          const rpObj: RepeatParamType = JSON.parse(rpStr);
          const elapsed = diffSeconds(Date.now(), rpObj.time);
          const paramsMatch =
            JSON.stringify(sortKeys(rpObj.params)) ===
            JSON.stringify(sortKeys(params));
          // 小于间隔时间 且 参数内容一致 → 视为重复提交
          if (elapsed < interval && paramsMatch) {
            // 响应头：可重试的时间点（毫秒）
            const retryAt = rpObj.time + interval * 1000;
            c.set('X-RepeatSubmit-Rest', `${retryAt}`);
            c.status = 200;
            return Resp.errMsg('不允许重复提交，请稍候再试');
          }
        } catch {
          // 缓存数据损坏，忽略并继续放行
        }
      }

      // 请求合法，保存当前请求时间和参数
      await redisCacheServer.set(
        '',
        cacheKey,
        JSON.stringify({
          time: Date.now(),
          params: params,
        }),
        interval
      );

      // 调用下一个处理程序
      return await next();
    };
  }

  static getName(): string {
    return 'REPEAT_SUBMIT';
  }
}

/**
 * 防止表单重复提交-中间件
 *
 * 小于间隔时间视为重复提交
 * @param interval 间隔时间(单位秒) 默认:5
 */
export function RepeatSubmitMiddleware(interval = 5) {
  return createMiddleware(
    RepeatSubmit as any,
    interval,
    RepeatSubmit.getName()
  );
}
