import { IMiddleware, Middleware, MidwayWebRouterService, createMiddleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

import { CACHE_REPEAT_SUBMIT } from '../constants/cache_key';
import { RedisCache } from '../datasource/redis/redis';
import { clientIP } from '../ip2region/ip2region';
import { diffSeconds } from '../utils/date/data';
import { md5 } from '../utils/crypto/hash';
import { Resp } from '../resp/api';

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
      const funcName = routerInfo.funcHandlerName;
      // 唯一标识（指定key + 客户端IP + 请求地址）
      const funcMd5 = md5(`${clientIP(c.ip)}:${funcName}`); 
      const cacheKey = `${CACHE_REPEAT_SUBMIT}:${funcMd5}`;

      // 从Redis读取上一次保存的请求时间和参数
      const redisCacheServer: RedisCache = await c.requestContext.getAsync(
        RedisCache
      );
      const rpStr = await redisCacheServer.get('', cacheKey);
      if (rpStr) {
        const rpObj: RepeatParamType = JSON.parse(rpStr);
        const compareTime = diffSeconds(Date.now(), rpObj.time);
        const compareParams =
          JSON.stringify(rpObj.params) === JSON.stringify(params);
        // 设置重复提交声明响应头（毫秒）
        c.set('X-RepeatSubmit-Rest', `${Date.now() + compareTime * 1000}`);
        // 小于间隔时间 且 参数内容一致
        if (compareTime < interval && compareParams) {
          c.status = 200;
          return Resp.errMsg('不允许重复提交，请稍候再试');
        }
      }

      // 保存请求时间和参数
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
    return 'REPAT_SUBMIT';
  }
}

/**
 * 防止表单重复提交-中间件
 * 
 * 小于间隔时间视为重复提交
 * @param interval 间隔时间(单位秒) 默认:5
 */
export function RepeatSubmitMiddleware(interval: number = 5) {
  return createMiddleware(RepeatSubmit, interval, RepeatSubmit.getName());
}
