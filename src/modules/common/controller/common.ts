import { createHash } from 'node:crypto';

import { Body, Controller, Post } from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';

import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { Resp } from '../../../internal/web/resp/api';

/**通用请求 控制层处理 */
@Controller('/api/v1/common')
export class CommonController {
  /**哈希编码 */
  @Post('/hash', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async hash(
    @Valid(Joi.string().required())
    @Body('type')
    type: 'sha1' | 'sha256' | 'sha512' | 'md5',
    @Valid(Joi.string().required()) @Body('str') str: string
  ): Promise<Resp> {
    const hash = createHash(type);
    hash.update(str);
    return Resp.okData(hash.digest('hex'));
  }
}
