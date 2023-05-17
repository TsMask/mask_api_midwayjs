import { Catch } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { HttpStatus } from '@midwayjs/core';
import { Result } from '../model/Result';

/**
 * 默认全局错误统一捕获
 *
 * 所有的未分类错误会到这里
 * @author TsMask
 */
@Catch()
export class DefaultErrorCatch {
  async catch(err: Error, ctx: Context) {
    const userName = ctx.loginUser?.user?.userName || '匿名';
    ctx.logger.error('%s : %s > %s', userName, err.name, err.message);
    let errMsg = err.message;
    if (err.name === 'QueryFailedError') {
      errMsg = '访问数据权限错误';
    }
    if (err.name === 'CSRFError') {
      errMsg = `无效 Referer ${ctx.header.referer || '未知'}`;
    }
    // 返回200，提示错误信息
    ctx.body = Result.errMsg(errMsg);
    ctx.status = HttpStatus.OK;
  }
}
