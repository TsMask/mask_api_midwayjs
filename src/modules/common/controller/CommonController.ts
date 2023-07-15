import { Body, Controller, Post } from '@midwayjs/decorator';
import {
  cryptoHmac,
  decryptWxData,
  encrypyHash,
} from '../../../framework/utils/CryptoUtils';
import { Result } from '../../../framework/vo/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';

/**
 * 通用请求
 *
 * @author TsMask
 */
@Controller('/common')
export class CommonController {
  /**
   * 哈希加密
   */
  @Post('/hash')
  @PreAuthorize()
  async hash(
    @Body('type') type: 'sha1' | 'sha256' | 'sha512' | 'md5',
    @Body('str') str: string
  ): Promise<Result> {
    return Result.okData(encrypyHash(str, type));
  }

  /**
   * 哈希加盐加密
   */
  @Post('/hmac')
  @PreAuthorize()
  async hmac(
    @Body('type') type: 'sha1' | 'sha256' | 'sha512' | 'md5',
    @Body('str') str: string
  ): Promise<Result> {
    return Result.okData(cryptoHmac(str, '89486', type));
  }

  /**
   * 微信数据解密
   */
  @Post('/decryptWxData')
  async wxData(
    @Body('encryptedData') encryptedData: string,
    @Body('key') key: string,
    @Body('iv') iv: string
  ) {
    return decryptWxData({
      encryptedData,
      key,
      iv,
    });
  }
}
