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

    // 过滤已经知道的错误
    const errMsgs = [
      { k: 'QueryFailedError', v: '访问数据权限错误' },
      { k: 'CSRFError', v: `无效 Referer ${ctx.header.referer || '未知'}` },
      { k: 'PayloadTooLargeError', v: '超出最大上传文件大小范围' },
      { k: 'MultipartInvalidFilenameError', v: '上传文件拓展格式不支持' },
    ];
    const msgItem = errMsgs.find(n => n.k === err.name);
    if (msgItem) {
      errMsg = msgItem.v;
    }

    // 返回200，提示错误信息
    ctx.body = Result.errMsg(errMsg);
    ctx.status = HttpStatus.OK;
  }
}
