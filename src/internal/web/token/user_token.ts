import { randomBytes } from 'node:crypto';

import { Inject, Provide, Singleton } from '@midwayjs/core';
import { sign, verify, Algorithm } from 'jsonwebtoken';

import { CACHE_TOKEN_SESSION, CACHE_TOKEN_USERS } from '../../shared/constants/cache_key';
import { JWT_DEVICE_ID, JWT_SESSION_ID, JWT_USER_ID } from '../../shared/constants/token';
import { RedisCache } from '../../infra/cache/redis';
import { GlobalConfig } from '../../config/config';
import { parseNumber } from '../../shared/parse/parse';
import { UserInfo } from './user_info';

/**一次登录生成的访问与刷新令牌 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
}

/**系统用户令牌工具验证处理 */
@Provide()
@Singleton()
export class UserTokenService {
  @Inject()
  private redis: RedisCache;

  @Inject()
  private config: GlobalConfig;

  /**
   * 为同一会话生成访问与刷新令牌
   * @param userId 用户ID
   * @param deviceFingerprint 设备指纹 SHA256
   * @returns [令牌对, 会话ID, 错误信息]
   */
  public async createTokenPair(
    userId: number,
    deviceFingerprint: string
  ): Promise<[TokenPair, string, string]> {
    const sessionId = randomBytes(16).toString('hex');
    const [accessToken, accessExpiresIn] = await this.userTokenCreate(
      userId,
      deviceFingerprint,
      'access',
      sessionId
    );
    const [refreshToken, refreshExpiresIn] = await this.userTokenCreate(
      userId,
      deviceFingerprint,
      'refresh',
      sessionId
    );
    if (
      !accessToken ||
      !refreshToken ||
      accessExpiresIn <= 0 ||
      refreshExpiresIn <= 0
    ) {
      return [
        {
          accessToken: '',
          refreshToken: '',
          accessExpiresIn: 0,
          refreshExpiresIn: 0,
        },
        '',
        'token generation failed',
      ];
    }
    return [
      {
        accessToken,
        refreshToken,
        accessExpiresIn,
        refreshExpiresIn,
      },
      sessionId,
      '',
    ];
  }

  /**
   * 生成指定会话的令牌
   * @param userId 用户ID
   * @param deviceFingerprint 设备指纹 SHA256
   * @param tokenType 令牌类型 access:访问 refresh:刷新
   * @param sessionId 会话ID
   * @returns [令牌, 有效秒数]
   */
  public async userTokenCreate(
    userId: number,
    deviceFingerprint: string,
    tokenType: 'access' | 'refresh',
    sessionId: string
  ): Promise<[string, number]> {
    if (userId <= 0 || sessionId.length !== 32) {
      return ['', 0];
    }

    const algorithm = this.signingMethod();
    let secret: string = this.config.get('jwt.secret');
    if (!secret) {
      return ['', 0];
    }

    const now = Math.round(Date.now() / 1000);
    const minutes = this.tokenMinutes(tokenType);
    if (minutes <= 0) {
      return ['', 0];
    }
    const exp = now + minutes * 60;
    if (tokenType === 'access') {
      secret = 'User_Access:' + secret;
    } else {
      secret = 'User_Refresh:' + secret;
    }

    const tokenStr = sign(
      {
        [JWT_DEVICE_ID]: deviceFingerprint,
        [JWT_SESSION_ID]: sessionId,
        [JWT_USER_ID]: userId,
        exp,
        iat: now,
        nbf: now - 10,
      },
      secret,
      { algorithm }
    );
    return [tokenStr, minutes * 60];
  }

  /**
   * 校验令牌签名、算法与基础声明
   * @param token 身份令牌
   * @param tokenType 令牌类型
   * @returns [令牌负载, 错误信息]
   */
  public async userTokenVerify(
    token: string,
    tokenType: 'access' | 'refresh'
  ): Promise<[Record<string, any>, string]> {
    try {
      let secret: string = this.config.get('jwt.secret');
      if (!secret) {
        return [{}, 'jwt secret not configured'];
      }
      if (tokenType === 'access') {
        secret = 'User_Access:' + secret;
      } else {
        secret = 'User_Refresh:' + secret;
      }

      const jwtToken = verify(token, secret, {
        algorithms: [this.signingMethod()],
      }) as Record<string, any>;
      if (
        parseNumber(jwtToken[JWT_USER_ID]) <= 0 ||
        String(jwtToken[JWT_SESSION_ID]).length !== 32
      ) {
        return [{}, 'token claims invalid'];
      }
      return [jwtToken, ''];
    } catch {
      return [{}, 'token invalid'];
    }
  }

  /**
   * 删除当前访问会话及其用户索引
   * @param token 访问令牌
   * @returns [用户名, 错误信息]
   */
  public async userInfoRemove(token: string): Promise<[string, string]> {
    const [claims, err] = await this.userTokenVerify(token, 'access');
    if (err) {
      return ['', err];
    }
    const info = await this.userInfoGet(claims);
    if (info.userId <= 0) {
      return ['', 'session not found'];
    }

    const sessionId = String(claims[JWT_SESSION_ID]);
    const rows = await this.redis.del('', this.sessionKey(sessionId));
    if (rows <= 0) {
      return [info.user.userName, 'session not found'];
    }
    await this.redis.zRem('', this.userIndexKey(info.userId), sessionId);
    return [info.user.userName, ''];
  }

  /**
   * 生成访问用户会话缓存，并维护用户会话索引
   * @param info 登录用户信息
   * @param ilobArr 登录客户端信息 [IP, 地点, 系统, 浏览器]
   * @returns 登录用户信息
   */
  public async userInfoCreate(
    info: UserInfo,
    ilobArr: string[]
  ): Promise<UserInfo> {
    if (info.userId <= 0 || info.sessionId.length !== 32) {
      return new UserInfo();
    }

    info.loginIp = ilobArr[0];
    info.loginLocation = ilobArr[1];
    info.os = ilobArr[2];
    info.browser = ilobArr[3];

    const accessTTL = this.tokenMinutes('access') * 60;
    const now = Date.now();
    info.loginTime = now;
    info.expireTime = now + accessTTL * 1000;
    info.user.userLoginIp = info.loginIp;
    info.user.userLoginTime = info.loginTime;
    info.user.userPassword = '';

    const created = await this.redis.set(
      '',
      this.sessionKey(info.sessionId),
      JSON.stringify(info),
      accessTTL
    );
    if (!created) {
      return new UserInfo();
    }

    const indexed = await this.redis.zAddAfterRemoveByScore(
      '',
      this.userIndexKey(info.userId),
      now,
      accessTTL,
      info.sessionId
    );
    if (!indexed) {
      await this.redis.del('', this.sessionKey(info.sessionId));
      return new UserInfo();
    }
    return info;
  }

  /**
   * 更新访问会话并保留原TTL
   * @param info 登录用户信息
   */
  public async UserInfoUpdate(info: UserInfo): Promise<void> {
    if (info.sessionId.length !== 32) {
      return;
    }
    info.user.userPassword = '';
    await this.redis.setWithExistingTTL(
      '',
      this.sessionKey(info.sessionId),
      JSON.stringify(info)
    );
  }

  /**
   * 读取访问会话，并校验令牌中的用户、设备与会话一致
   * @param claims 令牌负载
   * @returns 登录用户信息
   */
  public async userInfoGet(claims: Record<string, any>): Promise<UserInfo> {
    const info = new UserInfo();
    const sessionId = String(claims[JWT_SESSION_ID]);
    const deviceId = String(claims[JWT_DEVICE_ID]);
    if (sessionId.length !== 32) {
      return info;
    }

    const infoStr = await this.redis.get('', this.sessionKey(sessionId));
    if (!infoStr) {
      return info;
    }
    try {
      const saved = JSON.parse(infoStr) as UserInfo;
      if (
        saved.sessionId === sessionId &&
        saved.deviceId === deviceId &&
        saved.userId === parseNumber(claims[JWT_USER_ID]) &&
        saved.expireTime > Date.now()
      ) {
        return saved;
      }
    } catch {
      return info;
    }
    return info;
  }

  /**
   * 按用户索引批量清理会话
   * @param userIds 用户ID数组
   */
  public async removeByUserIds(userIds: number[]): Promise<void> {
    for (const userId of userIds) {
      const indexKey = this.userIndexKey(userId);
      const sessions = await this.redis.zRangeByScore(
        '',
        indexKey,
        '-inf',
        '+inf'
      );
      if (sessions.length === 0) {
        await this.redis.del('', indexKey);
        continue;
      }
      await this.redis.delKeys(
        '',
        sessions.map(sessionId => this.sessionKey(sessionId))
      );
      await this.redis.del('', indexKey);
    }
  }

  /**
   * 按会话ID批量清理会话
   * @param sessionIds 会话ID数组
   */
  public async removeBySessionIds(sessionIds: string[]): Promise<void> {
    for (const sessionId of sessionIds) {
      if (sessionId.length !== 32) {
        continue;
      }
      const infoStr = await this.redis.get('', this.sessionKey(sessionId));
      if (!infoStr) {
        continue;
      }
      try {
        const info = JSON.parse(infoStr) as UserInfo;
        if (info.userId > 0) {
          const rows = await this.redis.del('', this.sessionKey(sessionId));
          if (rows > 0) {
            await this.redis.zRem(
              '',
              this.userIndexKey(info.userId),
              sessionId
            );
          }
        }
      } catch {
        continue;
      }
    }
  }

  private signingMethod(): Algorithm {
    const algorithm: string = this.config.get('jwt.algorithm');
    switch (algorithm) {
      case 'HS512':
        return 'HS512';
      case 'HS384':
        return 'HS384';
      case 'HS256':
      default:
        return 'HS256';
    }
  }

  private tokenMinutes(tokenType: 'access' | 'refresh'): number {
    const key = tokenType === 'access' ? 'jwt.expiresIn' : 'jwt.refreshIn';
    return parseNumber(this.config.get(key));
  }

  private sessionKey(sessionId: string): string {
    return CACHE_TOKEN_SESSION + ':' + sessionId;
  }

  private userIndexKey(userId: number): string {
    return CACHE_TOKEN_USERS + ':' + userId;
  }
}
