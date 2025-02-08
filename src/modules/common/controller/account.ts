import { Controller, Body, Post, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import {
  LIMIT_IP,
  RateLimit,
} from '../../../framework/decorator/RateLimitMethodDecorator';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { HEADER_PREFIX } from '../../../framework/constants/token';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ipaddrLocation, uaOsBrowser } from '../../../framework/reqctx/param';
import { loginUser } from '../../../framework/reqctx/auth';
import { authorization } from '../../../framework/reqctx/context';
import { GlobalConfig } from '../../../framework/config/config';
import { TokenUtil } from '../../../framework/utils/token/token';
import { SysLogLoginService } from '../../system/service/sys_log_login';
import { AccountService } from '../service/account';
import { LoginBody } from '../model/login_body';

/**账号身份操作 控制层处理 */
@Controller()
export class AccountController {
  /**上下文 */
  @Inject()
  private c: Context;

  /**Token工具 */
  @Inject()
  private token: TokenUtil;

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
  @Post('/login')
  @RateLimit({ time: 300, count: 20, limitType: LIMIT_IP })
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
      const msg = `${errMsg} code: ${body.code}`;
      await this.sysLogLoginService.insert(body.username, STATUS_NO, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      this.c.status = 400;
      return Resp.codeMsg(40012, errMsg);
    }

    // 登录用户信息
    const [tokenInfo, err] = await this.accountService.byUsername(
      body.username,
      body.password
    );
    if (err) {
      this.c.status = 400;
      return Resp.codeMsg(40014, err);
    }

    // 生成令牌，创建系统访问记录
    const [info, tokenStr] = await this.token.create(tokenInfo, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    if (!tokenStr) {
      this.c.status = 400;
      return Resp.codeMsg(40001, 'token generation failed');
    } else {
      await this.accountService.updateLoginDateAndIP(info);
      await this.sysLogLoginService.insert(
        body.username,
        STATUS_YES,
        '登录成功',
        [ipaddr, location, os, browser]
      );
    }

    this.c.status = 200;
    return Resp.okData({
      accessToken: tokenStr,
      tokenType: HEADER_PREFIX.trimEnd(),
      expiresIn: (info.expireTime - info.loginTime) / 1000,
      userId: info.userId,
    });
  }

  /**登录用户信息 */
  @Get('/me')
  @PreAuthorize()
  public async me(): Promise<Resp> {
    const info = loginUser(this.c);
    if (!info.uuid) {
      this.c.status = 401;
      return Resp.codeMsg(40003, 'invalid login user information');
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
  @Get('/router')
  @PreAuthorize()
  public async router(): Promise<Resp> {
    const info = loginUser(this.c);
    if (!info.uuid) {
      this.c.status = 401;
      return Resp.codeMsg(40003, 'invalid login user information');
    }

    // 前端路由，系统管理员拥有所有
    const isSystemUser = this.config.isSystemUser(info.userId);
    const buildMenus = await this.accountService.routeMenus(
      info.userId,
      isSystemUser
    );

    this.c.status = 200;
    return Resp.okData(buildMenus);
  }

  /**系统登出 */
  @Post('/logout')
  @RateLimit({ time: 300, count: 5, limitType: LIMIT_IP })
  public async logout(): Promise<Resp> {
    const tokenStr = authorization(this.c);
    if (!tokenStr) {
      // 存在token时记录退出信息
      const userName = await this.token.remove(tokenStr);
      if (userName != '') {
        // 当前请求信息
        const [ipaddr, location] = await ipaddrLocation(this.c);
        const [os, browser] = await uaOsBrowser(this.c);
        // 创建系统访问记录
        this.sysLogLoginService.insert(userName, STATUS_YES, '退出成功', [
          ipaddr,
          location,
          os,
          browser,
        ]);
      }
    }
    return Resp.okMsg('logout successful');
  }
}
