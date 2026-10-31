import { Catch, httpError, HttpStatus, MidwayHttpError } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { Resp } from '../resp/api';

/**
 * 路由未找到-拦截器
 *
 * 404 错误会到这里
 */
@Catch(httpError.NotFoundError)
export class NotFound {
  async catch(_: MidwayHttpError, c: Context) {
    const msg = `Not Found ${c.method} ${c.path}`;
    // 返回404，提示错误信息
    c.body = Resp.codeMsg(404, msg);
    c.status = HttpStatus.NOT_FOUND;
  }
}
