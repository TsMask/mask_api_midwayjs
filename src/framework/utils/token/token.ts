import { Config, Inject, Provide, Singleton, httpError } from '@midwayjs/core';
import { JwtService } from '@midwayjs/jwt';
import ms = require('ms');
import { JWT_UUID, JWT_USER_ID, JWT_USER_NAME } from '../../constants/token';
import { TokenInfo } from './token_info';
import { RedisCache } from '../../datasource/redis/redis';
import { CACHE_LOGIN_TOKEN } from '../../constants/cache_key';
import { generateHash } from '../GenIdUtils';

/**Token工具验证处理 */
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
  public async remove(token: string): Promise<string> {
    const claims = await this.verify(token);
    if (claims) {
      // 清除缓存KEY
      const uuid = claims[JWT_UUID];
      const tokenKey = CACHE_LOGIN_TOKEN + ':' + uuid;
      const hasTokenkey = await this.redisCache.has('', tokenKey);
      if (hasTokenkey > 0) {
        await this.redisCache.del('', tokenKey);
      }
      // 判断可用登录信息返回用户账号
      return claims[JWT_USER_NAME];
    }
    return null;
  }

  /**
   * 令牌生成
   * @param loginUser 登录用户信息对象
   * @param ilobArgs 客户端IP UA标识
   * @returns 登录令牌
   */
  public async create(
    loginUser: TokenInfo,
    ilobArgs: string[]
  ): Promise<string> {
    // 生成用户唯一tokne32位
    const uuid = generateHash(32);
    loginUser.uuid = uuid;

    // 设置请求用户登录客户端
    loginUser.loginIp = ilobArgs[0];
    loginUser.loginLocation = ilobArgs[1];
    loginUser.os = ilobArgs[2];
    loginUser.browser = ilobArgs[3];

    // 设置新登录IP和登录时间
    loginUser.user.loginIp = loginUser.loginIp;
    loginUser.user.loginTime = loginUser.loginTime;

    // 设置用户令牌有效期并存入缓存
    loginUser = await this.cache(loginUser);

    // 生成令牌负荷uuid标识
    return this.jwtService.sign({
      [JWT_UUID]: uuid,
      [JWT_USER_ID]: loginUser.userId,
      [JWT_USER_NAME]: loginUser.user.userName,
    });
  }

  /**
   * 缓存登录用户信息
   * @param loginUser 登录用户信息对象
   * @returns 登录令牌
   */
  public async cache(loginUser: TokenInfo): Promise<TokenInfo> {
    // 计算配置的有效期
    const expTimestamp: number = ms(`${this.jwtExpiresIn}`);
    const iatTimestamp = Date.now();
    loginUser.loginTime = iatTimestamp;
    loginUser.expireTime = iatTimestamp + expTimestamp;
    loginUser.user.password = '';
    // 根据登录标识将loginUser缓存
    const tokenKey = CACHE_LOGIN_TOKEN + ':' + loginUser.uuid;
    await this.redisCache.setByExpire(
      '',
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
  async refreshIn(loginUser: TokenInfo): Promise<TokenInfo> {
    const refreshTimestamp = ms(`${this.jwtRefreshIn}`);
    // 相差不足xx分钟，自动刷新缓存
    const expireTime = loginUser.expireTime;
    const currentTime = Date.now();
    if (expireTime - currentTime <= refreshTimestamp) {
      loginUser = await this.cache(loginUser);
    }
    return loginUser;
  }

  /**
   * 校验令牌是否有效
   * @param token 身份令牌
   * @returns 负荷信息
   */
  public async verify(token: string): Promise<Record<string, any>> {
    try {
      // 判断加密算法是预期的加密算法
      const jwtToken = await this.jwtService.verify(token);
      if (jwtToken) {
        return jwtToken as Record<string, any>;
      }
    } catch (e) {
      if ('TokenExpiredError' === e.name) {
        throw new httpError.UnauthorizedError(
          `用户授权已过期, ${new Date(e.expiredAt).toLocaleString()}`
        );
      }
      if ('JsonWebTokenError' === e.name) {
        throw new httpError.UnauthorizedError('token invalid');
      }
      throw new httpError.UnauthorizedError('token valid error');
    }
  }

  /**
   * 缓存的登录用户信息
   * @param claims 令牌信息
   * @returns 身份信息
   */
  public async info(claims: Record<string, any>): Promise<TokenInfo> {
    let info = new TokenInfo();
    const uuid = claims[JWT_UUID];
    const tokenKey = CACHE_LOGIN_TOKEN + ':' + uuid;
    const hasKey = await this.redisCache.has('', tokenKey);
    if (hasKey > 0) {
      const infoStr = await this.redisCache.get('', tokenKey);
      if (infoStr) {
        try {
          return JSON.parse(infoStr) as TokenInfo;
        } catch (err: any) {
          throw new httpError.UnauthorizedError('token valid error');
        }
      }
    }
    return info;
  }
}
