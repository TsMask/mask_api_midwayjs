import { Controller, Body, Post, Get, Inject } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';

import {
  HEADER_PREFIX,
  JWT_DEVICE_ID,
  JWT_SESSION_ID,
  JWT_USER_ID,
} from '../../../internal/shared/constants/token';
import {
  deviceFingerprint,
  ipaddrLocation,
  uaOsBrowser,
} from '../../../internal/web/reqctx/param';
import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../internal/web/middleware/rate_limit';
import {
  CODE_AUTH_INVALID,
  CODE_PARAM_CHEACK,
} from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import {
  loginUser,
  loginUserToUserID,
} from '../../../internal/web/reqctx/auth';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../internal/shared/constants/common';
import { authorization } from '../../../internal/web/reqctx/context';
import { GlobalConfig } from '../../../internal/config/config';
import {
  TokenPair,
  UserTokenService,
} from '../../../internal/web/token/user_token';
import { UserInfo } from '../../../internal/web/token/user_info';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { SysLoginLogService } from '../../system/service/sys_login_log';
import { AccountService } from '../service/account';
import { LoginBody } from '../model/login_body';
import { LoginPhoneBody } from '../model/login_phone_body';

/**账号身份操作 控制层处理 */
@Controller('/api/v1/auth')
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
  private sysLoginLogService: SysLoginLogService;

  /**系统登录 */
  @Post('/login', {
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
      await this.sysLoginLogService.insert(body.username, STATUS_NO, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(errMsg);
    }

    // 登录用户信息
    const [info, infoErr] = await this.accountService.byUsername(
      body.username,
      body.password
    );
    if (infoErr !== '') {
      await this.sysLoginLogService.insert(body.username, STATUS_NO, infoErr, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(infoErr);
    }
    const deviceFingerprintStr = await deviceFingerprint(this.c, info.user_id);

    // 同一会话生成访问与刷新令牌；会话缓存与访问令牌同生命周期
    const [pair, sessionId, tokenErr] = await this.token.createTokenPair(
      info.user_id,
      deviceFingerprintStr
    );
    if (tokenErr !== '') {
      return Resp.errMsg('token generation failed');
    }
    info.device_id = deviceFingerprintStr;
    info.session_id = sessionId;

    // 记录会话，创建系统访问记录
    const userInfo = await this.token.userInfoCreate(info, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    if (userInfo.user_id <= 0) {
      return Resp.errMsg('token cache create failed');
    }
    await this.accountService.updateLoginDateAndIP(userInfo);
    await this.sysLoginLogService.insert(
      body.username,
      STATUS_YES,
      '登录成功',
      [ipaddr, location, os, browser]
    );

    return Resp.okData(authTokenData(pair, userInfo.user_id));
  }

  /**手机号验证码登录 */
  @Post('/login-phone', {
    middleware: [RateLimitMiddleware({ time: 180, count: 15, type: LIMIT_IP })],
  })
  public async loginPhone(@Body() body: LoginPhoneBody): Promise<Resp> {
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);

    const errMsg = await this.accountService.validateCaptchaSMS(
      body.phone,
      body.code,
      body.uuid
    );
    if (errMsg) {
      await this.sysLoginLogService.insert(body.phone, STATUS_NO, errMsg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(errMsg);
    }

    const [info, infoErr] = await this.accountService.byPhone(body.phone);
    if (infoErr !== '') {
      await this.sysLoginLogService.insert(body.phone, STATUS_NO, infoErr, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(infoErr);
    }

    const [pair, userInfo, issueErr] = await this.issueSession(info, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    if (issueErr !== '') {
      await this.sysLoginLogService.insert(
        info.user_name,
        STATUS_NO,
        issueErr,
        [ipaddr, location, os, browser]
      );
      return Resp.errMsg(issueErr);
    }

    await this.accountService.updateLoginDateAndIP(userInfo);
    await this.sysLoginLogService.insert(
      info.user_name,
      STATUS_YES,
      '手机号登录成功',
      [ipaddr, location, os, browser]
    );

    return Resp.okData(authTokenData(pair, userInfo.user_id));
  }

  /**系统登出 */
  @Post('/logout', {
    middleware: [RateLimitMiddleware({ time: 120, count: 15, type: LIMIT_IP })],
  })
  public async logout(): Promise<Resp> {
    const tokenStr = authorization(this.c);
    if (tokenStr) {
      // 存在token时记录退出信息
      const [userName, err] = await this.token.userInfoRemove(tokenStr);
      if (err === '') {
        // 当前请求信息
        const [ipaddr, location] = await ipaddrLocation(this.c);
        const [os, browser] = await uaOsBrowser(this.c);
        // 创建系统访问记录
        this.sysLoginLogService.insert(
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
  @Post('/refresh-token', {
    middleware: [RateLimitMiddleware({ time: 60, count: 5, type: LIMIT_IP })],
  })
  public async refreshToken(
    @Body() body: Record<string, string>
  ): Promise<Resp> {
    const refreshTokenValue = body.refresh_token;
    if (!refreshTokenValue) {
      this.c.status = 422;
      return Resp.codeMsg(
        CODE_PARAM_CHEACK,
        'bind err: refresh_token is empty'
      );
    }

    // 验证刷新令牌是否有效
    const [claims, err] = await this.token.userTokenVerify(
      refreshTokenValue,
      'refresh'
    );
    if (err !== '') {
      this.c.status = 401;
      return Resp.codeMsg(CODE_AUTH_INVALID, err);
    }
    const userId = parseNumber(claims[JWT_USER_ID]);

    // 登录用户信息
    const [info, errMsg] = await this.accountService.byUserId(userId);
    if (errMsg !== '') {
      return Resp.errMsg(errMsg);
    }

    // 设备指纹信息是否一致
    const deviceId = String(claims[JWT_DEVICE_ID]);
    const oldSessionId = String(claims[JWT_SESSION_ID]);
    const deviceFingerprintStr = await deviceFingerprint(this.c, userId);
    if (deviceId !== deviceFingerprintStr) {
      this.c.status = 401;
      return Resp.codeMsg(CODE_AUTH_INVALID, 'device fingerprint mismatch');
    }

    // 每次刷新轮换会话；旧访问与刷新令牌随旧会话一起失效
    const [pair, sessionId, tokenErr] = await this.token.createTokenPair(
      userId,
      deviceFingerprintStr
    );
    if (tokenErr !== '') {
      return Resp.errMsg('token generation failed');
    }
    info.device_id = deviceFingerprintStr;
    info.session_id = sessionId;

    // 当前请求信息
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);
    // 记录令牌，创建系统访问记录
    const userInfo = await this.token.userInfoCreate(info, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    if (userInfo.user_id <= 0) {
      return Resp.errMsg('token cache create failed');
    }
    await this.token.removeBySessionIds([oldSessionId]);
    await this.accountService.updateLoginDateAndIP(userInfo);
    await this.sysLoginLogService.insert(
      userInfo.user_name,
      STATUS_YES,
      '刷新访问令牌成功',
      [ipaddr, location, os, browser]
    );

    return Resp.okData(authTokenData(pair, userInfo.user_id));
  }

  /**登录用户信息 */
  @Get('/me', {
    middleware: [AuthorizeUserMiddleware()],
  })
  public async me(): Promise<Resp> {
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(CODE_AUTH_INVALID, err);
    }

    // 角色权限集合，系统管理员拥有所有权限
    const isSystemUser = this.config.isSystemUser(info.user_id);
    const [roles, perms] = await this.accountService.roleAndMenuPerms(
      info.user_id,
      isSystemUser
    );

    return Resp.okData({
      user: info.user,
      roles: roles,
      permissions: perms,
    });
  }

  /**登录用户路由信息 */
  @Get('/menus', {
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

  /**生成新会话并写入缓存 */
  private async issueSession(
    info: UserInfo,
    ilobArr: string[]
  ): Promise<[TokenPair, UserInfo, string]> {
    const deviceFingerprintStr = await deviceFingerprint(this.c, info.user_id);
    const [pair, sessionId, tokenErr] = await this.token.createTokenPair(
      info.user_id,
      deviceFingerprintStr
    );
    if (tokenErr !== '') {
      return [pair, info, tokenErr];
    }

    info.device_id = deviceFingerprintStr;
    info.session_id = sessionId;
    const userInfo = await this.token.userInfoCreate(info, ilobArr);
    if (userInfo.user_id <= 0) {
      return [pair, userInfo, 'token cache create failed'];
    }
    return [pair, userInfo, ''];
  }
}

export function authTokenData(pair: TokenPair, userId: number) {
  return {
    token_type: HEADER_PREFIX,
    access_token: pair.accessToken,
    expires_in: pair.accessExpiresIn,
    refresh_token: pair.refreshToken,
    refresh_expires_in: pair.refreshExpiresIn,
    user_id: userId,
  };
}
