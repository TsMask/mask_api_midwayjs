import { Provide, Inject, Singleton } from '@midwayjs/core';

import { md5 } from '../../../framework/utils/crypto/hash';
import { CACHE_OAUTH2_CODE } from '../../../framework/constants/cache_key';
import { generateCode } from '../../../framework/utils/generate/generate';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { Oauth2Info } from '../../../framework/token/oauth2_info';
import { Oauth2ClientRepository } from '../repository/oauth2_client';
import { Oauth2Client } from '../model/oauth2_client';

/**用户授权第三方应用信息 服务层处理 */
@Provide()
@Singleton()
export class Oauth2Service {
  /**缓存操作 */
  @Inject()
  private redis: RedisCache;

  /**用户授权第三方应用表 */
  @Inject()
  private oauth2ClientRepository: Oauth2ClientRepository;

  /**
   * 创建授权码
   * @return 授权码
   */
  public async createCode(): Promise<string> {
    const code = generateCode(8);
    const uuid = md5(code);
    const verifyKey = CACHE_OAUTH2_CODE + ':' + uuid;
    // 授权码有效期，单位秒
    const codeExpiration = 2 * 60 * 60;
    await this.redis.set('', verifyKey, code, codeExpiration);
    return code;
  }

  /**
   * 校验授权码
   * @param code 授权码
   * @returns 错误信息
   */
  public async validateCode(code: string): Promise<string> {
    if (code.length > 16) {
      return 'code length error';
    }
    const uuid = md5(code);
    const verifyKey = CACHE_OAUTH2_CODE + ':' + uuid;
    const captcha = await this.redis.get('', verifyKey);
    if (captcha == '') {
      return 'code expire';
    }
    await this.redis.del('', verifyKey);
    if (captcha != code.toLowerCase()) {
      return 'code error';
    }
    return '';
  }

  /**
   * 客户端信息
   * @param clientId 客户端ID
   * @param clientSecret 客户端密钥
   * @return 错误结果信息
   */
  public async byClient(
    clientId: string,
    clientSecret: string
  ): Promise<[Oauth2Info, string]> {
    const info = new Oauth2Info();

    // 查询用户登录账号
    let item = new Oauth2Client();
    item.clientId = clientId;
    item.clientSecret = clientSecret;
    const rows = await this.oauth2ClientRepository.select(item);
    if (rows.length > 0) {
      item = rows[0];
    }
    if (item.clientId === '') {
      return [info, 'clientId or clientSecret is not exist'];
    }

    info.clientId = clientId;
    // 用户权限组标识
    info.scope = [];
    return [info, ''];
  }

  /**
   * 更新登录时间和IP
   * @returns 更新是否成功
   */
  public async updateLoginDateAndIP(info: Oauth2Info): Promise<boolean> {
    const item = await this.oauth2ClientRepository.selectByClientId(
      info.clientId
    );
    item.loginIp = info.loginIp;
    item.loginTime = info.loginTime;
    const rows = await this.oauth2ClientRepository.update(item);
    return rows > 0;
  }
}
