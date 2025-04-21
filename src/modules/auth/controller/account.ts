import { Controller, Body, Post, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import {
  HEADER_PREFIX,
  JWT_DEVICE_ID,
  JWT_USER_ID,
} from '../../../framework/constants/token';
import {
  deviceFingerprint,
  ipaddrLocation,
  uaOsBrowser,
} from '../../../framework/reqctx/param';
import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../framework/middleware/rate_limit';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { loginUser, loginUserToUserID } from '../../../framework/reqctx/auth';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { authorization } from '../../../framework/reqctx/context';
import { GlobalConfig } from '../../../framework/config/config';
import { UserTokenService } from '../../../framework/token/user_token';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { SysLogLoginService } from '../../system/service/sys_log_login';
import { AccountService } from '../service/account';
import { LoginBody } from '../model/login_body';

/**账号身份操作 控制层处理 */
@Controller()
export class AccountController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**系统用户令牌工具 */
  @Inject()
  private token: UserTokenService;

  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**账号身份操作服务 */
  @Inject()
  private accountService: AccountService;

  /**系统登录访问 */
  @Inject()
  private sysLogLoginService: SysLogLoginService;

  /**系统登录 */
  @Post('/auth/login', {
    middleware: [RateLimitMiddleware({ time: 180, count: 15, type: LIMIT_IP })],
  })
  public async login(@Body() body: LoginBody): Promise<Resp> {
    // 当前请求信息
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);

    // 校验验证码 根据错误信息，创建系统访问记录
    const errMsg = await this.accountService.validateCaptcha(
      body.code,
      body.uuid
    );
    if (errMsg) {
      const msg = `${errMsg} code ${body.code}`;
      await this.sysLogLoginService.insert(body.username, STATUS_NO, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(errMsg);
    }

    // 登录用户信息
    let [info, err] = await this.accountService.byUsername(
      body.username,
      body.password
    );
    if (err) {
      await this.sysLogLoginService.insert(body.username, STATUS_NO, err, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(err);
    }
    const deviceFingerprintStr = await deviceFingerprint(this.c, info.userId);

    // 生成访问令牌
    const [accessToken, expiresIn] = await this.token.userTokenCreate(
      info.userId,
      deviceFingerprintStr,
      'access'
    );
    if (accessToken == '' || expiresIn == 0) {
      return Resp.errMsg('token generation failed');
    }
    // 生成刷新令牌
    const [refreshToken, refreshExpiresIn] = await this.token.userTokenCreate(
      info.userId,
      deviceFingerprintStr,
      'refresh'
    );

    // 记录令牌，创建系统访问记录
    info = await this.token.userInfoCreate(info, deviceFingerprintStr, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    await this.accountService.updateLoginDateAndIP(info);
    await this.sysLogLoginService.insert(
      body.username,
      STATUS_YES,
      '登录成功',
      [ipaddr, location, os, browser]
    );

    return Resp.okData({
      tokenType: HEADER_PREFIX,
      accessToken: accessToken,
      expiresIn: expiresIn,
      refreshToken: refreshToken,
      refreshExpiresIn: refreshExpiresIn,
      userId: info.userId,
    });
  }

  /**系统登出 */
  @Post('/auth/logout', {
    middleware: [RateLimitMiddleware({ time: 120, count: 15, type: LIMIT_IP })],
  })
  public async logout(): Promise<Resp> {
    const tokenStr = authorization(this.c);
    if (tokenStr) {
      // 存在token时记录退出信息
      const [userName, err] = await this.token.userInfoRemove(tokenStr);
      if (err !== '') {
        // 当前请求信息
        const [ipaddr, location] = await ipaddrLocation(this.c);
        const [os, browser] = await uaOsBrowser(this.c);
        // 创建系统访问记录
        this.sysLogLoginService.insert(
          userName,
          STATUS_YES,
          '主动注销登录信息',
          [ipaddr, location, os, browser]
        );
      }
    }
    return Resp.okMsg('logout successful');
  }

  /**刷新Token */
  @Post('/auth/refresh-token', {
    middleware: [RateLimitMiddleware({ time: 60, count: 5, type: LIMIT_IP })],
  })
  public async refreshToken(
    @Body() body: Record<string, string>
  ): Promise<Resp> {
    if (body.refreshToken === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: refreshToken is empty');
    }

    // 验证刷新令牌是否有效
    const [claims, err] = await this.token.userTokenVerify(
      body.refreshToken,
      'refresh'
    );
    if (err != '') {
      this.c.status = 401;
      return Resp.codeMsg(401001, err);
    }
    const userId = parseNumber(claims[JWT_USER_ID]);

    // 登录用户信息
    let [info, errMsg] = await this.accountService.byUserId(userId);
    if (errMsg != '') {
      return Resp.errMsg(errMsg);
    }

    // 设备指纹信息是否一致
    const deviceId = claims[JWT_DEVICE_ID];
    const deviceFingerprintStr = await deviceFingerprint(this.c, userId);
    if (deviceId != deviceFingerprintStr) {
      return Resp.errMsg('device fingerprint mismatch');
    }

    // 生成访问令牌
    const [accessToken, expiresIn] = await this.token.userTokenCreate(
      userId,
      deviceFingerprintStr,
      'access'
    );
    if (accessToken == '' || expiresIn == 0) {
      return Resp.errMsg('token generation failed');
    }
    // 生成刷新令牌
    const now = Math.round(Date.now() / 1000);
    const exp = parseNumber(claims['exp']);
    const iat = parseNumber(claims['iat']);
    let refreshExpiresIn = Math.round(exp - now);
    let refreshToken = body.refreshToken;

    // 如果当前时间大于过期时间的一半，则生成新令牌
    const halfExp = exp - Math.round(now - iat) / 2;
    if (now > halfExp) {
      [refreshToken, refreshExpiresIn] = await this.token.userTokenCreate(
        userId,
        deviceFingerprintStr,
        'refresh'
      );
    }

    // 当前请求信息
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);
    // 记录令牌，创建系统访问记录
    info = await this.token.userInfoCreate(info, deviceFingerprintStr, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    await this.accountService.updateLoginDateAndIP(info);
    await this.sysLogLoginService.insert(
      info.user.userName,
      STATUS_YES,
      '刷新访问令牌成功',
      [ipaddr, location, os, browser]
    );

    return Resp.okData({
      tokenType: HEADER_PREFIX,
      accessToken: accessToken,
      expiresIn: expiresIn,
      refreshToken: refreshToken,
      refreshExpiresIn: refreshExpiresIn,
      userId: userId,
    });
  }

  /**登录用户信息 */
  @Get('/me', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async me(): Promise<Resp> {
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(401002, err);
    }

    // 角色权限集合，系统管理员拥有所有权限
    const isSystemUser = this.config.isSystemUser(info.userId);
    const [roles, perms] = await this.accountService.roleAndMenuPerms(
      info.userId,
      isSystemUser
    );

    return Resp.okData({
      user: info.user,
      roles: roles,
      permissions: perms,
    });
  }

  /**登录用户路由信息 */
  @Get('/router', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async router(): Promise<Resp> {
    const loginUserId = loginUserToUserID(this.c);

    // 前端路由，系统管理员拥有所有
    const isSystemUser = this.config.isSystemUser(loginUserId);
    const buildMenus = await this.accountService.routeMenus(
      loginUserId,
      isSystemUser
    );

    return Resp.okData(buildMenus);
  }
}
