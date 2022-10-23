import { Catch } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { HttpStatus } from '@midwayjs/core';
import { Result } from '../core/Result';

@Catch()
export class DefaultErrorFilter {
  async catch(err: Error, ctx: Context) {
    // 所有的未分类错误会到这里
    ctx.logger.error(
      '%s : %s > %s',
      ctx.loginUser?.user?.userName,
      err.name,
      err.message
    );
    // 返回200，提示错误信息
    ctx.body = Result.errMsg(err.message);
    ctx.status = HttpStatus.OK;
  }
}
