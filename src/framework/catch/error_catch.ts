import { Catch, HttpStatus } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { Resp } from '../resp/api';
import { loginUserToUserID } from '../reqctx/auth';

/**
 * 默认全局错误统一捕获
 *
 * 所有的未分类错误会到这里
 */
@Catch()
export class ErrorCatch {
  async catch(err: Error, c: Context) {
    const userId = loginUserToUserID(c);
    c.logger.error(
      '[Recovery][%d] panic recovered: %s => %s %s',
      userId,
      c.url,
      err.name,
      err.message
    );

    // 返回错误响应给客户端
    if (c.app.getEnv() === 'prod') {
      c.body = Resp.codeMsg(500001, 'internal error');
      c.status = HttpStatus.INTERNAL_SERVER_ERROR;
      return;
    }

    let msg = err.message;
    // 过滤已经知道的错误
    const errMsgs = [
      { k: 'QueryFailedError', v: '访问数据权限错误' },
      { k: 'CSRFError', v: `无效 Referer ${c.header.referer || '未知'}` },
      { k: 'PayloadTooLargeError', v: '超出最大上传文件大小范围' },
      { k: 'MultipartInvalidFilenameError', v: '上传文件拓展格式不支持' },
    ];
    const msgItem = errMsgs.find(n => n.k === err.name);
    if (msgItem) {
      msg = msgItem.v;
    }

    // 返回500，提示错误信息
    c.body = Resp.codeMsg(500001, msg);
    c.status = HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
