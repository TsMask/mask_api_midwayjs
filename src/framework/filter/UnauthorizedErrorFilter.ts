import { Catch } from '@midwayjs/decorator';
import { httpError, HttpStatus, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Result } from '../core/Result';

/**
 * 未授权认证用户-拦截器
 *
 * 401 错误会到这里
 * @author TsMask <340112800@qq.com>
 */
@Catch(httpError.UnauthorizedError)
export class UnauthorizedErrorFilter {
  async catch(err: MidwayHttpError, ctx: Context) {
    const userName = ctx.loginUser?.user?.userName || '匿名';
    ctx.logger.error('%s : %s > %s', userName, err.name, err.message);
    // 返回200，提示错误信息
    ctx.body = Result.errMsg(err.message, 401);
    ctx.status = HttpStatus.OK;
  }
}
