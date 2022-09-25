import { Catch } from '@midwayjs/decorator';
import { httpError, HttpStatus, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { Result } from '../core/result';

@Catch(httpError.NotFoundError)
export class NotFoundFilter {
  async catch(err: MidwayHttpError, ctx: Context) {
    // 404 错误会到这里
    ctx.logger.error('%s > %s', err.name, err.message);
    // ctx.redirect('/404.html');
    // 返回200，提示错误信息
    ctx.body = Result.err_msg(err.message, 404);
    ctx.status = HttpStatus.OK;
  }
}
