import { Context } from '@midwayjs/koa';
import { Catch, HttpStatus } from '@midwayjs/core';
import { MidwayValidationError } from '@midwayjs/validate';

import { Resp } from '../resp/api';

/**
 * 处理校验错误-拦截器
 *
 * 422 参数错误会到这里
 */
@Catch(MidwayValidationError)
export class ValidateError {
  async catch(err: MidwayValidationError, c: Context) {
    c.logger.error('%s > %s', err.name, err.message);
    // 返回422，提示错误信息
    c.body = Resp.codeMsg(422001, err.message);
    c.status = HttpStatus.UNPROCESSABLE_ENTITY;
  }
}
