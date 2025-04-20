import { createHash } from 'node:crypto';

import { Body, Controller, Post } from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';

import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { Resp } from '../../../framework/resp/api';

/**通用请求 控制层处理 */
@Controller('/common')
export class CommonController {
  /**哈希编码 */
  @Post('/hash', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async hash(
    @Valid(RuleType.string().required())
    @Body('type')
    type: 'sha1' | 'sha256' | 'sha512' | 'md5',
    @Valid(RuleType.string().required()) @Body('str') str: string
  ): Promise<Resp> {
    const hash = createHash(type);
    hash.update(str);
    return Resp.okData(hash.digest('hex'));
  }
}
