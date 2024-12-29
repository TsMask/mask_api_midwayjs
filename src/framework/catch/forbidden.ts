import { Catch, httpError, HttpStatus, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import {Resp} from '../resp/api';

/**
 * 当前操作没有权限-拦截器
 *
 * 403 错误会到这里
 * @author TsMask
 */
@Catch(httpError.ForbiddenError)
export class Forbidden {
  async catch(err: MidwayHttpError, ctx: Context) {
    const userName = ctx.loginUser?.user?.userName || '匿名';
    ctx.logger.error('%s : %s > %s', userName, err.name, err.message);
    // 返回403，提示错误信息
    ctx.body = Resp.codeMsg(403, err.message);
    ctx.status = HttpStatus.FORBIDDEN;
  }
}
