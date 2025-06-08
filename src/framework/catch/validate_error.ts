import { Context } from '@midwayjs/koa';
import { Catch, HttpStatus } from '@midwayjs/core';
import { MidwayValidationError } from '@midwayjs/validate';

import { Resp } from '../resp/api';
import { CODE_PARAM_PARSER } from '../resp/code';

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
    c.body = Resp.codeMsg(CODE_PARAM_PARSER, err.message);
    c.status = HttpStatus.UNPROCESSABLE_ENTITY;
  }
}
