import { Body, Controller, Post } from '@midwayjs/core';
import { createHash } from 'crypto';

import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';

/**通用请求 控制层处理 */
@Controller('/common')
export class CommonController {
  /**哈希编码 */
  @Post('/hash')
  @PreAuthorize()
  public async hash(
    @Body('type') type: 'sha1' | 'sha256' | 'sha512' | 'md5',
    @Body('str') str: string
  ): Promise<Resp> {
    const hash = createHash(type);
    hash.update(str);
    return Resp.okData(hash.digest('hex'));
  }
}
