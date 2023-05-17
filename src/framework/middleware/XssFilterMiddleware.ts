import { IMiddleware } from '@midwayjs/core';
import { Middleware } from '@midwayjs/decorator';
import { NextFunction, Context } from '@midwayjs/koa';
import { filterXSS } from 'xss';

/**
 * 跨站脚本XSS过滤-中间件
 *
 * @author TsMask
 */
@Middleware()
export class XssFilterMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    /**
     * 递归字段处理xss
     * @param obj JSON对象
     * @returns obj JSON对象
     */
    function recursiveXssField(obj: Record<string, any>) {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        // JSON对象进入递归解析
        if (Object.prototype.toString.call(value) === '[object Object]') {
          obj[key] = recursiveXssField(value);
          continue;
        }
        // 非字符串不处理
        if (typeof value !== 'string') continue;
        // 进行标签转义
        obj[key] = filterXSS(value);
      }
      return obj;
    }

    return async (ctx: Context, next: NextFunction) => {
      const body = ctx.request.body;
      if (body) {
        ctx.request.body = recursiveXssField(body);
      }
      await next();
    };
  }

  ignore(ctx: Context): boolean {
    // 忽略 GET DELETE
    const method = ctx.method;
    if (!method || ['GET', 'DELETE'].includes(method)) {
      return true;
    }
    // 忽略非json类型
    const contentType = ctx.get('content-type');
    if (!contentType.startsWith('application/json')) {
      return true;
    }
    // 忽略配置的白名单
    const ignorePaths = ctx.app.getConfig('xssIgnorePaths');
    if (ignorePaths && ignorePaths.includes(ctx.path)) {
      return true;
    }
    return false;
  }

  static getName(): string {
    return 'xss-filter';
  }
}
