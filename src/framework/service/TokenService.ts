import { Inject, Provide } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { JwtService } from '@midwayjs/jwt';
import {
  LOGIN_USER_KEY,
  TOKEN_PREFIX,
} from '../../common/constants/CommonConstants';
import { LoginUser } from '../core/vo/LoginUser';
import { RedisCache } from '../redis/RedisCache';
import { LOGIN_TOKEN_KEY } from '../../common/constants/CacheKeysConstants';
import { SysUser } from '../core/model/SysUser';
import { generateID } from '../../common/utils/GenIdUtils';
import { getRealAddressByIp } from '../../common/utils/ip2region';
import { getUaInfo } from '../../common/utils/UAParserUtils';
import ms = require('ms');
import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
import { PermissionService } from './PermissionService';

/**
 * token验证处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class TokenService {
  @Inject()
  private ctx: Context;

  @Inject()
  private jwtService: JwtService;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private permissionService: PermissionService;

  /**
   * 清除用户登录令牌
   */
  async removeToken(): Promise<string> {
    const loginUser = await this.getLoginUser();
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
   * @return 登录用户信息对象
   */
  async createLoginUser(user: SysUser): Promise<LoginUser> {
    delete user.password;
    const loginUser = new LoginUser();
    loginUser.userId = user.userId;
    loginUser.deptId = user.deptId;
    loginUser.user = user;
    // 用户权限组标识
    loginUser.permissions = await this.permissionService.getMenuPermission(
      user
    );
    return loginUser;
  }

  /**
   * 创建用户登录令牌
   * @param loginUser 登录用户信息对象
   * @returns 登录令牌
   */
  async createToken(loginUser: LoginUser): Promise<string> {
    // 生成用户唯一tokne32位
    const uuid = generateID(32);
    loginUser.uuid = uuid;
    // 设置请求用户登录客户端
    loginUser = await this.setUserAgent(loginUser);
    // 设置用户令牌有效期并存入缓存
    await this.setUserToken(loginUser);
    // 生成令牌负荷uuid标识
    return this.jwtService.sign({
      [LOGIN_USER_KEY]: uuid,
    });
  }

  /**
   * 验证令牌有效期，相差不足20分钟，自动刷新缓存
   * @param loginUser 登录用户信息对象
   * @returns 登录令牌
   */
  async verifyToken(loginUser: LoginUser): Promise<LoginUser> {
    // 从本地配置获取jwt信息
    const jwtRefreshIn: string = this.ctx.app.getConfig('jwtRefreshIn');
    const timeout = ms(jwtRefreshIn);
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
   * @returns 登录用户信息对象
   */
  private async setUserAgent(loginUser: LoginUser): Promise<LoginUser> {
    const ip = this.ctx.ip;
    if (ip.includes('127.0.0.1')) {
      loginUser.ipaddr = '127.0.0.1';
      loginUser.loginLocation = '内网IP';
    } else {
      // 解析ip地址
      loginUser.ipaddr = ip;
      loginUser.loginLocation = await getRealAddressByIp(ip);
    }
    // 解析请求用户代理信息
    const ua = await getUaInfo(this.ctx.get('user-agent'));
    const bName = ua.getBrowser().name;
    loginUser.browser = `${bName || '未知'}`;
    const oName = ua.getOS().name;
    loginUser.os = `${oName || '未知'}`;
    return loginUser;
  }

  /**
   * 设置令牌有效期
   * @param loginUser 登录用户信息对象
   */
  private async setUserToken(loginUser: LoginUser): Promise<void> {
    // 从本地配置获取jwt信息
    const { expiresIn } = this.ctx.app.getConfig('jwt');
    const timestamp: number = ms(String(expiresIn));
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
   * 获取请求token
   */
  private async getHeaderToken(): Promise<string> {
    // 从本地配置获取token信息
    const jwtHeader = this.ctx.app.getConfig('jwtHeader');
    // 获取请求携带的令牌
    let token = this.ctx.get(jwtHeader);
    if (token && token.startsWith(TOKEN_PREFIX)) {
      token = token.replace(TOKEN_PREFIX, '');
    }
    return token;
  }

  /**
   * 获取用户身份信息
   * @returns 用户信息对象
   */
  async getLoginUser(): Promise<LoginUser> {
    // 获取请求携带的令牌
    const token = await this.getHeaderToken();
    if (token) {
      try {
        const jwtInfo = await this.jwtService.verify(token);
        if (jwtInfo) {
          const uuid = jwtInfo[LOGIN_USER_KEY];
          return await this.getLoginUserCache(uuid);
        }
      } catch (e) {
        if ('TokenExpiredError' === e.name) {
          throw new UnauthorizedError(`用户授权已过期, ${e.expiredAt}.`);
        }
        if ('JsonWebTokenError' === e.name) {
          throw new UnauthorizedError('用户授权无效认证.');
        }
        throw new UnauthorizedError(`用户授权信息异常, ${e.message}.`);
      }
    }
    return null;
  }

  /**
   * 设置用户身份信息
   * @param loginUser 登录用户信息对象
   */
  async setLoginUser(loginUser: LoginUser): Promise<void> {
    // 用户权限组标识
    loginUser.permissions = await this.permissionService.getMenuPermission(
      loginUser.user
    );
    // 重新设置刷新令牌有效期
    await this.setUserToken(loginUser);
  }
}
