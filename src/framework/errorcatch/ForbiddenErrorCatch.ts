import { Catch } from '@midwayjs/decorator';
import { httpError, HttpStatus, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Result } from '../vo/Result';

/**
 * 当前操作没有权限-拦截器
 *
 * 403 错误会到这里
 * @author TsMask
 */
@Catch(httpError.ForbiddenError)
export class ForbiddenErrorCatch {
  async catch(err: MidwayHttpError, ctx: Context) {
    const userName = ctx.loginUser?.user?.userName || '匿名';
    ctx.logger.error('%s : %s > %s', userName, err.name, err.message);
    // 返回200，提示错误信息
    ctx.body = Result.errMsg(err.message, 403);
    ctx.status = HttpStatus.FORBIDDEN;
  }
}
