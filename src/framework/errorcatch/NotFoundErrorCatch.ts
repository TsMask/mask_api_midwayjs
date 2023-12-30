import { Catch, httpError, HttpStatus, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Result } from '../vo/Result';

/**
 * 路由未找到-拦截器
 *
 * 404 错误会到这里
 * @author TsMask
 */
@Catch(httpError.NotFoundError)
export class NotFoundErrorCatch {
  async catch(err: MidwayHttpError, ctx: Context) {
    const userName = ctx.loginUser?.user?.userName || '匿名';
    ctx.logger.error('%s : %s > %s', userName, err.name, err.message);
    // 返回200，提示错误信息
    ctx.body = Result.errMsg(err.message, 404);
    ctx.status = HttpStatus.NOT_FOUND;
  }
}
