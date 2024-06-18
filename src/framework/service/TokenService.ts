import { Config, Inject, Provide, Singleton, httpError } from '@midwayjs/core';
import { JwtService } from '@midwayjs/jwt';
import ms = require('ms');
import {
  TOKEN_JWT_UUID,
  TOKEN_JWT_KEY,
  TOKEN_JWT_NAME,
} from '../constants/TokenConstants';
import { LoginUser } from '../vo/LoginUser';
import { RedisCache } from '../cache/RedisCache';
import { LOGIN_TOKEN_KEY } from '../constants/CacheKeysConstants';
import { generateHash } from '../utils/GenIdUtils';

/**
 * token验证处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class TokenService {
  @Inject()
  private jwtService: JwtService;

  @Inject()
  private redisCache: RedisCache;

  /**从本地配置获取jwt过期时间信息 */
  @Config('jwt.expiresIn')
  private jwtExpiresIn: string;

  /**从本地配置获取token有效期内自动刷新信息 */
  @Config('jwtRefreshIn')
  private jwtRefreshIn: string;

  /**
   * 清除登录用户信息UUID
   * @param token 身份令牌
   */
  async removeToken(token: string): Promise<string> {
    const claims = await this.verifyToken(token);
    if (claims) {
      // 清除缓存KEY
      const uuid = claims[TOKEN_JWT_UUID];
      const tokenKey = LOGIN_TOKEN_KEY + uuid;
      const hasTokenkey = await this.redisCache.hasKey(tokenKey);
      if (hasTokenkey) {
        await this.redisCache.del(tokenKey);
      }
      // 判断可用登录信息返回用户账号
      return claims[TOKEN_JWT_NAME];
    }
    return null;
  }

  /**
   * 令牌生成
   * @param loginUser 登录用户信息对象
   * @param ilobArgs 客户端IP UA标识
   * @returns 登录令牌
   */
  async createToken(loginUser: LoginUser, ilobArgs: string[]): Promise<string> {
    // 生成用户唯一tokne32位
    const uuid = generateHash(32);
    loginUser.uuid = uuid;

    // 设置请求用户登录客户端
    loginUser.ipaddr = ilobArgs[0];
    loginUser.loginLocation = ilobArgs[1];
    loginUser.os = ilobArgs[2];
    loginUser.browser = ilobArgs[3];

    // 设置新登录IP和登录时间
    loginUser.user.loginIp = loginUser.ipaddr;
    loginUser.user.loginDate = loginUser.loginTime;

    // 设置用户令牌有效期并存入缓存
    loginUser = await this.cacheLoginUser(loginUser);

    // 生成令牌负荷uuid标识
    return this.jwtService.sign({
      [TOKEN_JWT_UUID]: uuid,
      [TOKEN_JWT_KEY]: loginUser.userId,
      [TOKEN_JWT_NAME]: loginUser.user.userName,
    });
  }

  /**
   * 缓存登录用户信息
   * @param loginUser 登录用户信息对象
   */
  async cacheLoginUser(loginUser: LoginUser): Promise<LoginUser> {
    // 计算配置的有效期
    const expTimestamp: number = ms(`${this.jwtExpiresIn}`);
    const iatTimestamp = Date.now();
    loginUser.loginTime = iatTimestamp;
    loginUser.expireTime = iatTimestamp + expTimestamp;
    loginUser.user.password = '';
    // 根据登录标识将loginUser缓存
    const tokenKey = LOGIN_TOKEN_KEY + loginUser.uuid;
    await this.redisCache.setByExpire(
      tokenKey,
      JSON.stringify(loginUser),
      Math.ceil(Number(expTimestamp / 1000))
    );
    return loginUser;
  }

  /**
   * 验证令牌有效期，相差不足20分钟，自动刷新缓存
   * @param loginUser 登录用户信息对象
   * @returns 登录令牌
   */
  async refreshInToken(loginUser: LoginUser): Promise<LoginUser> {
    const refreshTimestamp = ms(`${this.jwtRefreshIn}`);
    // 相差不足xx分钟，自动刷新缓存
    const expireTime = loginUser.expireTime;
    const currentTime = Date.now();
    if (expireTime - currentTime <= refreshTimestamp) {
      loginUser = await this.cacheLoginUser(loginUser);
    }
    return loginUser;
  }

  /**
   * 校验令牌是否有效
   * @param token 身份令牌
   */
  async verifyToken(token: string): Promise<Record<string, any>> {
    try {
      const jwtInfo = await this.jwtService.verify(token);
      if (jwtInfo) {
        return jwtInfo as Record<string, any>;
      }
    } catch (e) {
      if ('TokenExpiredError' === e.name) {
        throw new httpError.UnauthorizedError(
          `用户授权已过期, ${new Date(e.expiredAt).toLocaleString()}`
        );
      }
      if ('JsonWebTokenError' === e.name) {
        throw new httpError.UnauthorizedError('用户授权无效认证');
      }
      throw new httpError.UnauthorizedError(`用户授权信息异常, ${e.message}`);
    }
  }

  /**
   * 校验令牌是否有效
   * @param token 身份令牌
   */
  async getLoginUser(
    claims: Record<string, any>
  ): Promise<LoginUser | undefined> {
    const uuid = claims[TOKEN_JWT_UUID];
    const tokenKey = LOGIN_TOKEN_KEY + uuid;
    const hasTokenkey = await this.redisCache.hasKey(tokenKey);
    if (hasTokenkey) {
      const userStr = await this.redisCache.get(tokenKey);
      return JSON.parse(userStr);
    }
    return undefined;
  }
}
