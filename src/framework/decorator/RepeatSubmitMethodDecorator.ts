import {
  JoinPoint,
  REQUEST_OBJ_CTX_KEY,
  createCustomMethodDecorator,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { CACHE_REPEAT_SUBMIT } from '../constants/cache_key';
import { RedisCache } from '../datasource/redis/redis';
import { diffSeconds } from '../utils/date/data';
import { clientIP } from '../ip2region/ip2region';
import { Resp } from '../resp/api';

/**重复参数Redis格式数据类型 */
type RepeatParamType = {
  /**提交时间(时间戳)*/
  time: number;
  /**参数 */
  params: Record<string, any>;
};

/**装饰器key标识-防止表单重复提交 */
export const METHOD_KEY_REPEAT_SUBMIT = 'decorator_method:repeat_submit';

/**
 * 装饰器声明-防止表单重复提交
 *
 * 小于间隔时间视为重复提交
 * @param interval 间隔时间(单位秒) 默认:5
 */
export function RepeatSubmit(interval = 5): MethodDecorator {
  return createCustomMethodDecorator(METHOD_KEY_REPEAT_SUBMIT, interval);
}

/**
 * 实现装饰器-防止表单重复提交
 *
 * @param options.metadata 方法装饰器参数
 * @returns 返回结果
 */
export function RepeatSubmitVerify(options: { metadata: number }) {
  return {
    around: async (joinPoint: JoinPoint) => {
      // 装饰器所在的实例上下文
      const c: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];
      // 提交间隔时间
      let interval = options.metadata;

      // 提交参数
      const params: Record<string, any> = Object.assign(
        {},
        c.request.body,
        c.request.query
      );

      // 获取客户端IP
      const clientIPStr = clientIP(c.ip);

      // 唯一标识（指定key + 客户端IP + 请求地址）
      const cacheKey =  `${CACHE_REPEAT_SUBMIT}:${clientIPStr}:${c.path}`;

      // 从Redis读取上一次保存的请求时间和参数
      const redisCacheServer: RedisCache = await c.requestContext.getAsync(
        RedisCache
      );
      const rpStr = await redisCacheServer.get('', cacheKey);
      if (rpStr) {
        const rpObj: RepeatParamType = JSON.parse(rpStr);
        const compareTime = diffSeconds(Date.now(), rpObj.time);
        const compareParams = JSON.stringify(rpObj.params) === JSON.stringify(params);
        // 设置重复提交声明响应头（毫秒）
        c.set('X-RepeatSubmit-Rest', `${Date.now() + compareTime * 1000}`);
        // 小于间隔时间 且 参数内容一致
        if (compareTime < interval && compareParams) {
          return Resp.errMsg('不允许重复提交，请稍候再试');
        }
      }

      // 保存请求时间和参数
      await redisCacheServer.setByExpire(
        '',
        cacheKey,
        JSON.stringify({
          time: Date.now(),
          params: params,
        }),
        interval
      );

      // 执行原方法
      return await joinPoint.proceed(...joinPoint.args);
    },
  };
}
