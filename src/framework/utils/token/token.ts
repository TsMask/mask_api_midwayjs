import { Config, Inject, Provide, Singleton, httpError } from '@midwayjs/core';
import { JwtService } from '@midwayjs/jwt';
import ms = require('ms');
import { JWT_UUID, JWT_USER_ID, JWT_USER_NAME } from '../../constants/token';
import { TokenInfo } from './token_info';
import { RedisCache } from '../../datasource/redis/redis';
import { CACHE_LOGIN_TOKEN } from '../../constants/cache_key';
import { generateCode } from '../generate/generate';

/**Token工具验证处理 */
@Provide()
@Singleton()
export class TokenUtil {
  @Inject()
  private jwtService: JwtService;

  @Inject()
  private redis: RedisCache;

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
      const hasTokenkey = await this.redis.has('', tokenKey);
      if (hasTokenkey > 0) {
        await this.redis.del('', tokenKey);
      }
      // 判断可用登录信息返回用户账号
      return claims[JWT_USER_NAME];
    }
    return null;
  }

  /**
   * 令牌生成
   * @param tokenInfo 登录用户信息对象
   * @param ilobArgs 客户端IP UA标识
   * @returns [登录用户信息对象, 令牌字符串]
   */
  public async create(
    tokenInfo: TokenInfo,
    ilobArgs: string[]
  ): Promise<[TokenInfo, string]> {
    // 生成用户唯一tokne32位
    const uuid = generateCode(32);
    tokenInfo.uuid = uuid;

    // 设置请求用户登录客户端
    tokenInfo.loginIp = ilobArgs[0];
    tokenInfo.loginLocation = ilobArgs[1];
    tokenInfo.os = ilobArgs[2];
    tokenInfo.browser = ilobArgs[3];

    // 设置新登录IP和登录时间
    tokenInfo.user.loginIp = tokenInfo.loginIp;
    tokenInfo.user.loginTime = tokenInfo.loginTime;

    // 设置用户令牌有效期并存入缓存
    tokenInfo = await this.cache(tokenInfo);

    // 生成令牌负荷uuid标识
    const tokenStr = await this.jwtService.sign({
      [JWT_UUID]: uuid,
      [JWT_USER_ID]: tokenInfo.userId,
      [JWT_USER_NAME]: tokenInfo.user.userName,
      ait: tokenInfo.loginTime,
    });
    return [tokenInfo, tokenStr];
  }

  /**
   * 缓存登录用户信息
   * @param tokenInfo 登录用户信息对象
   * @returns 登录令牌
   */
  public async cache(tokenInfo: TokenInfo): Promise<TokenInfo> {
    // 计算配置的有效期
    const expTimestamp: number = ms(`${this.jwtExpiresIn}`);
    const iatTimestamp = Date.now();
    tokenInfo.loginTime = iatTimestamp;
    tokenInfo.expireTime = iatTimestamp + expTimestamp;
    tokenInfo.user.password = '';
    // 登录信息标识缓存
    const tokenKey = CACHE_LOGIN_TOKEN + ':' + tokenInfo.uuid;
    await this.redis.setByExpire(
      '',
      tokenKey,
      JSON.stringify(tokenInfo),
      Math.ceil(Number(expTimestamp / 1000))
    );
    return tokenInfo;
  }

  /**
   * 验证令牌有效期，相差不足20分钟，自动刷新缓存
   * @param tokenInfo 登录用户信息对象
   * @returns 登录令牌
   */
  async refreshIn(tokenInfo: TokenInfo): Promise<TokenInfo> {
    const refreshTimestamp = ms(`${this.jwtRefreshIn}`);
    // 相差不足xx分钟，自动刷新缓存
    const expireTime = tokenInfo.expireTime;
    const currentTime = Date.now();
    if (expireTime - currentTime <= refreshTimestamp) {
      tokenInfo = await this.cache(tokenInfo);
    }
    return tokenInfo;
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
    const hasKey = await this.redis.has('', tokenKey);
    if (hasKey > 0) {
      const infoStr = await this.redis.get('', tokenKey);
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
