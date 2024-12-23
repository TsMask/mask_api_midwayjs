import { Catch, httpError, HttpStatus, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import result from '../result/result';

/**
 * 未授权认证用户-拦截器
 *
 * 401 错误会到这里
 * @author TsMask
 */
@Catch(httpError.UnauthorizedError)
export class Unauthorized {
  async catch(err: MidwayHttpError, ctx: Context) {
    const userName = ctx.loginUser?.user?.userName || '匿名';
    ctx.logger.error('%s : %s > %s', userName, err.name, err.message);
    // 返回401，提示错误信息
    ctx.body = result.codeMsg(401, err.message);
    ctx.status = HttpStatus.UNAUTHORIZED;
  }
}
