import { Context } from '@midwayjs/koa';
import { Catch, HttpStatus } from '@midwayjs/core';
import { MidwayValidationError } from '@midwayjs/validate';
import {Resp} from '../resp/api';

/**
 * 处理校验错误-拦截器
 *
 * 422 参数错误会到这里
 * @author TsMask
 */
@Catch(MidwayValidationError)
export class ValidateError {
  async catch(err: MidwayValidationError, ctx: Context) {
    const userName = ctx.loginUser?.user?.userName || '匿名';
    ctx.logger.error('%s : %s > %s', userName, err.name, err.message);
    // 返回422，提示错误信息
    ctx.body = Resp.codeMsg(422, err.message);
    ctx.status = HttpStatus.UNPROCESSABLE_ENTITY;
  }
}
