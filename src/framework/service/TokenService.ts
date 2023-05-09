import { Config, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { JwtService } from '@midwayjs/jwt';
import {
  TOKEN_JWT_UUID,
  TOKEN_JWT_KEY,
  TOKEN_KEY_PREFIX,
} from '../constants/TokenConstants';
import { LoginUser } from '../model/LoginUser';
import { RedisCache } from '../cache/RedisCache';
import { LOGIN_TOKEN_KEY } from '../constants/CacheKeysConstants';
import { generateID } from '../utils/GenIdUtils';
import { getRealAddressByIp } from '../utils/ip2region';
import { getUaInfo } from '../utils/UAParserUtils';
import ms = require('ms');
import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
import { PermissionService } from './PermissionService';
import { SysUser } from '../../modules/system/model/SysUser';
import { IP_INNER_ADDR, IP_INNER_LOCATION } from '../constants/CommonConstants';

/**
 * token验证处理
 *
 * @author TsMask
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class TokenService {
  @Inject()
  private jwtService: JwtService;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private permissionService: PermissionService;

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
    loginUser.permissions = await this.permissionService.getMenuPermission(
      user.userId,
      isAdmin
    );
    return loginUser;
  }

  /**
   * 创建用户登录令牌
   * @param loginUser 登录用户信息对象
   * @param clientIP 客户端IP
   * @param userAgent 客户端UA标识
   * @returns 登录令牌
   */
  async createToken(
    loginUser: LoginUser,
    clientIP: string,
    userAgent: string
  ): Promise<string> {
    // 生成用户唯一tokne32位
    const uuid = generateID(32);
    loginUser.uuid = uuid;
    // 设置请求用户登录客户端
    loginUser = await this.setUserAgent(loginUser, clientIP, userAgent);
    // 设置用户令牌有效期并存入缓存
    await this.setUserToken(loginUser);
    // 生成令牌负荷uuid标识
    return this.jwtService.sign({
      [TOKEN_JWT_UUID]: uuid,
      [TOKEN_JWT_KEY]: loginUser.userId,
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
   * 设置用户代理信息
   * @param loginUser 登录用户信息对象
   * @param clientIP 客户端IP
   * @param userAgent 客户端UA标识
   * @returns 登录用户信息对象
   */
  private async setUserAgent(
    loginUser: LoginUser,
    clientIP: string,
    userAgent: string
  ): Promise<LoginUser> {
    // 解析ip地址
    if (clientIP.includes(IP_INNER_ADDR)) {
      loginUser.ipaddr = clientIP.replace(IP_INNER_ADDR, '');
      loginUser.loginLocation = IP_INNER_LOCATION;
    } else {
      loginUser.ipaddr = clientIP;
      loginUser.loginLocation = await getRealAddressByIp(clientIP);
    }
    // 解析请求用户代理信息
    const ua = await getUaInfo(userAgent);
    const bName = ua.getBrowser().name;
    const bVersion = ua.getBrowser().version;
    if (bName && bVersion) {
      loginUser.browser = `${bName} ${bVersion}`;
    } else {
      loginUser.browser = '未知 未知';
    }
    const oName = ua.getOS().name;
    const oVersion = ua.getOS().version;
    if (oName && oVersion) {
      loginUser.os = `${oName} ${oVersion}`;
    } else {
      loginUser.os = '未知 未知';
    }
    return loginUser;
  }

  /**
   * 设置令牌有效期
   * @param loginUser 登录用户信息对象
   */
  private async setUserToken(loginUser: LoginUser): Promise<void> {
    const timestamp: number = ms(`${this.jwtExpiresIn}`);
    const second = Number(timestamp / 1000);
    loginUser.loginTime = Date.now();
    loginUser.expireTime = loginUser.loginTime + timestamp;
    // 根据token将loginUser缓存
    const tokenKey = this.getTokenKey(loginUser.uuid);
    await this.redisCache.setByExpire(
      tokenKey,
      JSON.stringify(loginUser),
      second
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
    if (this.redisCache.hasKey(tokenKey)) {
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
    if (await this.redisCache.hasKey(tokenKey)) {
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
        throw new UnauthorizedError(
          `用户授权已过期, ${new Date(e.expiredAt).toLocaleString()}`
        );
      }
      if ('JsonWebTokenError' === e.name) {
        throw new UnauthorizedError('用户授权无效认证');
      }
      throw new UnauthorizedError(`用户授权信息异常, ${e.message}`);
    }
  }

  /**
   * 设置用户身份信息
   * @param loginUser 登录用户信息对象
   * @param isAdmin 是否管理员，默认否
   */
  async setLoginUser(loginUser: LoginUser, isAdmin = false): Promise<void> {
    // 用户权限组标识
    loginUser.permissions = await this.permissionService.getMenuPermission(
      loginUser.userId,
      isAdmin
    );
    // 重新设置刷新令牌有效期
    await this.setUserToken(loginUser);
  }
}
