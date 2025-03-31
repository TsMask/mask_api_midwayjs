import { Inject, Provide, Singleton } from '@midwayjs/core';
import { sign, Algorithm, verify } from 'jsonwebtoken';

import { JWT_DEVICE_ID, JWT_USER_ID } from '../constants/token';
import { CACHE_TOKEN_DEVICE } from '../constants/cache_key';
import { RedisCache } from '../datasource/redis/redis';
import { GlobalConfig } from '../config/config';
import { parseNumber } from '../utils/parse/parse';
import { UserInfo } from './user_info';

/**系统用户令牌工具验证处理 */
@Provide()
@Singleton()
export class UserTokenService {
  /**缓存服务 */
  @Inject()
  private redis: RedisCache;

  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**
   * 生成令牌
   * @param userId 用户ID
   * @param deviceFingerprint 设备指纹 SHA256
   * @param tokenType 令牌类型 access:访问令牌 refresh:刷新令牌
   * @returns [令牌, 过期时间]
   */
  public async userTokenCreate(
    userId: number,
    deviceFingerprint: string,
    tokenType: 'access' | 'refresh'
  ): Promise<[string, number]> {
    // 令牌算法 HS256 HS384 HS512
    const algorithm: string = this.config.get('jwt.algorithm');
    let method: Algorithm = undefined;
    switch (algorithm) {
      case 'HS512':
        method = 'HS512';
        break;
      case 'HS384':
        method = 'HS384';
        break;
      case 'HS256':
      default:
        method = 'HS256';
    }
    // 生成令牌设置密钥
    let secret: string = this.config.get('jwt.secret');
    // 设置令牌过期时间
    const now = Math.round(Date.now() / 1000);
    let exp = now;
    if (tokenType === 'access') {
      const expiresIn = parseNumber(this.config.get('jwt.expiresIn'));
      exp = now + expiresIn * 60;
      secret = 'User_Access:' + secret;
    }
    if (tokenType === 'refresh') {
      const refreshIn = parseNumber(this.config.get('jwt.refreshIn'));
      exp = now + refreshIn * 60;
      secret = 'User_Refresh:' + secret;
    }
    // 生成令牌负荷绑定uuid标识
    const jwtToken = {
      [JWT_DEVICE_ID]: deviceFingerprint,
      [JWT_USER_ID]: userId,
      exp: exp, // 过期时间
      iat: now, // 签发时间
      nbf: now - 10, // 生效时间
    };

    const tokenStr = sign(jwtToken, secret, { algorithm: method });
    const expSeconds = Math.round(exp - now);
    return [tokenStr, expSeconds];
  }

  /**
   * 校验令牌是否有效
   * @param token 身份令牌
   * @param tokenType 令牌类型 access:访问令牌 refresh:刷新令牌
   * @returns [令牌负荷, 错误信息]
   */
  public async userTokenVerify(
    token: string,
    tokenType: 'access' | 'refresh'
  ): Promise<[Record<string, any>, string]> {
    try {
      // 判断加密算法是预期的加密算法
      let secret: string = this.config.get('jwt.secret');
      if (tokenType === 'access') {
        secret = 'User_Access:' + secret;
      }
      if (tokenType === 'refresh') {
        secret = 'User_Refresh:' + secret;
      }
      const jwtToken = verify(token, secret);
      if (jwtToken) {
        return [jwtToken as Record<string, any>, ''];
      }
    } catch (e) {
      console.error(e.name, '=>', e.message);
      return [null, 'token invalid'];
    }
    return [null, 'token valid error'];
  }

  /**
   * 清除访问用户信息缓存
   * @param token 身份令牌
   * @returns [用户名, 错误信息]
   */
  public async userInfoRemove(token: string): Promise<[string, string]> {
    const [claims, err] = await this.userTokenVerify(token, 'access');
    if (err != '') {
      return ['', err];
    }
    const info = await this.userInfoGet(claims);
    if (info.user.userName != '') {
      // 清除缓存KEY
      const deviceId = claims[JWT_DEVICE_ID];
      const tokenKey = CACHE_TOKEN_DEVICE + ':' + deviceId;
      const rows = await this.redis.del('', tokenKey);
      if (rows > 0) {
        return [info.user.userName, ''];
      }
    }
    return ['', 'token invalid'];
  }

  /**
   * 生成访问用户信息缓存
   * @param info 登录用户信息对象
   * @param deviceFingerprint 设备指纹 SHA256
   * @param ilobArr 登录客户端信息 [IP, 地点, 系统, 浏览器]
   * @returns 登录用户信息对象
   */
  public async userInfoCreate(
    info: UserInfo,
    deviceFingerprint: string,
    ilobArr: string[]
  ): Promise<UserInfo> {
    info.deviceId = deviceFingerprint;

    // 设置请求用户登录客户端
    info.loginIp = ilobArr[0];
    info.loginLocation = ilobArr[1];
    info.os = ilobArr[2];
    info.browser = ilobArr[3];

    const expiresIn = parseNumber(this.config.get('jwt.expiresIn'));
    const now = Date.now();
    const exp = now + expiresIn * 60 * 1000;
    info.loginTime = now;
    info.expireTime = exp;
    // 设置新登录IP和登录时间
    info.user.loginIp = info.loginIp;
    info.user.loginTime = info.loginTime;
    info.user.password = '';
    // 登录信息标识缓存
    const tokenKey = CACHE_TOKEN_DEVICE + ':' + info.deviceId;
    await this.redis.set(
      '',
      tokenKey,
      JSON.stringify(info),
      Math.round(expiresIn * 60)
    );
    return info;
  }

  /**
   * 更新访问用户信息缓存
   * @param info 登录用户信息对象
   */
  public async UserInfoUpdate(info: UserInfo): Promise<void> {
    info.user.password = '';
    // 登录信息标识缓存
    const tokenKey = CACHE_TOKEN_DEVICE + ':' + info.deviceId;
    const expiration = await this.redis.getExpire('', tokenKey);
    await this.redis.set('', tokenKey, JSON.stringify(info), expiration);
  }

  /**
   * 缓存的访问用户信息
   * @param claims 令牌信息
   * @returns 身份信息
   */
  public async userInfoGet(claims: Record<string, any>): Promise<UserInfo> {
    const info = new UserInfo();
    info.userId = 0;
    const deviceId = claims[JWT_DEVICE_ID];
    const tokenKey = CACHE_TOKEN_DEVICE + ':' + deviceId;
    const hasKey = await this.redis.has('', tokenKey);
    if (hasKey > 0) {
      const infoStr = await this.redis.get('', tokenKey);
      if (infoStr) {
        try {
          return JSON.parse(infoStr) as UserInfo;
        } catch (e) {
          console.error(e.name, 'parse =>', e.message);
        }
      }
    }
    return info;
  }
}
