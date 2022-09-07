import { Catch } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { HttpStatus } from '@midwayjs/core';
import { UNDEFINED_EXCEPTION } from '../utils/result.utils';

@Catch()
export class DefaultErrorFilter {
  async catch(err: Error, ctx: Context) {
    // 所有的未分类错误会到这里
    ctx.logger.error('%s => %s > %s', ctx.path, err.name, err.message);
    // 返回200，提示错误信息
    ctx.body = UNDEFINED_EXCEPTION(err.message);
    ctx.status = HttpStatus.OK;
  }
}
