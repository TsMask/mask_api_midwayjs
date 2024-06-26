import { Config, Inject, Provide, Singleton, httpError } from '@midwayjs/core';
import { JwtService } from '@midwayjs/jwt';
import ms = require('ms');
import {
  TOKEN_JWT_UUID,
  TOKEN_JWT_KEY,
  TOKEN_KEY_PREFIX,
  TOKEN_JWT_NAME,
} from '../constants/TokenConstants';
import { LoginUser } from '../vo/LoginUser';
import { RedisCache } from '../cache/RedisCache';
import { LOGIN_TOKEN_KEY } from '../constants/CacheKeysConstants';
import { generateHash } from '../utils/GenIdUtils';
import { SysUser } from '../../modules/system/model/SysUser';
import { SysMenuServiceImpl } from '../../modules/system/service/impl/SysMenuServiceImpl';
import { ADMIN_PERMISSION } from '../constants/AdminConstants';

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

  @Inject()
  private sysMenuService: SysMenuServiceImpl;

  /**从本地配置获取jwt过期时间信息 */
  @Config('jwt.expiresIn')
  private jwtExpiresIn: string;

  /**从本地配置获取token有效期内自动刷新信息 */
  @Config('jwtRefreshIn')
  private jwtRefreshIn: string;

  /**
   * 清除用户登录令牌
   * @param token 身份令牌
   */
  async removeToken(token: string): Promise<string> {
    const loginUser = await this.getLoginUser(token);
    if (loginUser) {
      await this.delLoginUserCache(loginUser.uuid);
      // 判断可用登录信息返回用户账号
      return loginUser.user.userName;
    }
    return null;
  }

  /**
   * 创建登录用户信息对象
   * @param user 登录用户信息
   * @param isAdmin — 是否管理员，默认否
   * @return 登录用户信息对象
   */
  async createLoginUser(user: SysUser, isAdmin = false): Promise<LoginUser> {
    delete user.password;
    const loginUser = new LoginUser();
    loginUser.userId = user.userId;
    loginUser.deptId = user.deptId;
    loginUser.user = user;
    // 用户权限组标识
    if (isAdmin) {
      loginUser.permissions = [ADMIN_PERMISSION];
    } else {
      loginUser.permissions = await this.sysMenuService.selectMenuPermsByUserId(
        user.userId
      );
    }
    return loginUser;
  }

  /**
   * 创建用户登录令牌
   * @param loginUser 登录用户信息对象
   * @param clientIP 客户端IP
   * @param userAgent 客户端UA标识
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
    await this.setUserToken(loginUser);

    // 生成令牌负荷uuid标识
    return this.jwtService.sign({
      [TOKEN_JWT_UUID]: uuid,
      [TOKEN_JWT_KEY]: loginUser.userId,
      [TOKEN_JWT_NAME]: loginUser.user.userName,
    });
  }

  /**
   * 验证令牌有效期，相差不足20分钟，自动刷新缓存
   * @param loginUser 登录用户信息对象
   * @returns 登录令牌
   */
  async verifyToken(loginUser: LoginUser): Promise<LoginUser> {
    const timeout = ms(`${this.jwtRefreshIn}`);
    // 相差不足xx分钟，自动刷新缓存
    const expireTime = loginUser.expireTime;
    const currentTime = Date.now();
    if (expireTime - currentTime <= timeout) {
      await this.setUserToken(loginUser);
    }
    return loginUser;
  }

  /**
   * 设置令牌有效期
   * @param loginUser 登录用户信息对象
   */
  private async setUserToken(loginUser: LoginUser): Promise<void> {
    // 计算配置的有效期
    const expTimestamp: number = ms(`${this.jwtExpiresIn}`);
    const iatTimestamp = Date.now();
    loginUser.loginTime = iatTimestamp;
    loginUser.expireTime = iatTimestamp + expTimestamp;
    // 生成有效时间
    const expSecond = Math.ceil(Number(expTimestamp / 1000));
    // 根据登录标识将loginUser缓存
    const tokenKey = this.getTokenKey(loginUser.uuid);
    delete loginUser.user.password;
    await this.redisCache.setByExpire(
      tokenKey,
      JSON.stringify(loginUser),
      expSecond
    );
  }

  /**
   * token缓存key标识
   * @param uuid 唯一标识
   * @returns 生成缓存key标识
   */
  private getTokenKey(uuid: string): string {
    return LOGIN_TOKEN_KEY + uuid;
  }

  /**
   * 获取用户身份信息
   * @param token jwt信息内唯一标识
   */
  private async getLoginUserCache(token: string): Promise<LoginUser> {
    const tokenKey = this.getTokenKey(token);
    const hasTokenkey = await this.redisCache.hasKey(tokenKey);
    if (hasTokenkey) {
      const userStr = await this.redisCache.get(tokenKey);
      return JSON.parse(userStr);
    }
    return null;
  }

  /**
   * 删除用户身份信息
   * @param token jwt信息内唯一标识
   */
  private async delLoginUserCache(token: string): Promise<void> {
    const tokenKey = this.getTokenKey(token);
    const hasTokenkey = await this.redisCache.hasKey(tokenKey);
    if (hasTokenkey) {
      await this.redisCache.del(tokenKey);
    }
  }

  /**
   * 获取请求携带的令牌
   * @param headerToken 请求头字符串
   * @returns 去除前缀字符串
   */
  async getHeaderToken(headerToken: string): Promise<string> {
    if (headerToken && headerToken.startsWith(TOKEN_KEY_PREFIX)) {
      headerToken = headerToken.replace(TOKEN_KEY_PREFIX, '');
    }
    return headerToken;
  }

  /**
   * 获取用户身份信息
   * @param token 身份令牌
   * @returns 用户信息对象
   */
  async getLoginUser(token: string): Promise<LoginUser> {
    try {
      const jwtInfo = await this.jwtService.verify(token);
      if (jwtInfo) {
        const uuid = jwtInfo[TOKEN_JWT_UUID];
        return await this.getLoginUserCache(uuid);
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
   * 设置用户身份信息
   * @param loginUser 登录用户信息对象
   * @param isAdmin 是否管理员，默认否
   */
  async setLoginUser(loginUser: LoginUser, isAdmin = false): Promise<void> {
    // 用户权限组标识
    if (isAdmin) {
      loginUser.permissions = [ADMIN_PERMISSION];
    } else {
      loginUser.permissions = await this.sysMenuService.selectMenuPermsByUserId(
        loginUser.userId
      );
    }
    // 重新设置刷新令牌有效期
    await this.setUserToken(loginUser);
  }
}
