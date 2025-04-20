import { IMiddleware, Middleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

/**请求响应日志-中间件 */
@Middleware()
export class ReportMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (c: Context, next: NextFunction) => {
      // 执行下一个 Web 中间件，最后执行到控制器
      // 这里可以拿到下一个中间件或者控制器的返回值
      const res = await next();

      // 计算请求处理时间，并打印日志
      const duration = Date.now() - c.startTime;
      c.logger.info('\n访问接口: %s \n总耗时: %dms', c.path, duration);

      return res;
    };
  }

  static getName(): string {
    return 'REPORT';
  }
}
