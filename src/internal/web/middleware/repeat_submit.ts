import {
  IMiddleware,
  Middleware,
  MidwayWebRouterService,
  createMiddleware,
} from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

import { CACHE_REPEAT_SUBMIT } from '../../shared/constants/cache_key';
import { RedisCache } from '../../infra/cache/redis';
import { clientIP } from '../../infra/ip2region/ip2region';
import { md5 } from '../../shared/crypto/hash';
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
  /**提交时间的 Unix 秒 */
  time: number;
  /**上次提交参数的 JSON 字符串 */
  params: string;
};

/**防止表单重复提交-中间件 */
@Middleware()
export class RepeatSubmit implements IMiddleware<Context, NextFunction> {
  resolve(_: any, interval = 5) {
    if (interval < 5) interval = 5;
    return async (c: Context, next: NextFunction) => {
      // 提交参数
      const params: Record<string, any> = Object.assign({}, c.request.body);
      for (const [key, value] of Object.entries(c.request.query)) {
        if (params[key] === undefined) {
          params[key] = Array.isArray(value) ? value[0] : value;
        }
      }
      const paramsStr = JSON.stringify(sortKeys(params));

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
          const elapsed = Math.floor(Date.now() / 1000) - rpObj.time;
          const paramsMatch = rpObj.params === paramsStr;
          // 小于间隔时间 且 参数内容一致 → 视为重复提交
          if (elapsed < interval && paramsMatch) {
            // 响应头：可重试的时间点（毫秒）
            const resetAt = (rpObj.time + interval) * 1000;
            c.set('X-RepeatSubmit-Reset', `${resetAt}`);
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
          time: Math.floor(Date.now() / 1000),
          params: paramsStr,
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
