import { Controller, Body, Post, Get, Inject } from '@midwayjs/core';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { LoginBodyVo } from '../model/LoginBodyVo';
import { AccountService } from '../service/AccountService';
import result from '../../../framework/result/result';

/**
 * 账号身份操作处理
 *
 * @author TsMask
 */
@Controller()
export class AccountController {
  @Inject()
  private accountService: AccountService;

  /**
   * 系统登录
   */
  @Post('/login')
  @RateLimit({ time: 300, count: 20, limitType: LimitTypeEnum.IP })
  async login(@Body() loginBodyVo: LoginBodyVo): Promise<Result> {
    const { username, password, code, uuid } = loginBodyVo;
    if (!username || !password) return result.err();
    await this.accountService.validateCaptcha(username, code, uuid);
    const tokenStr = await this.accountService.loginByUsername(
      username,
      password
    );
    return result.okData({
      accessToken: tokenStr,
      tokenType: "strings.TrimRight(constants.HEADER_PREFIX, ' ')",
      expiresIn: '(loginUser.ExpireTime - loginUser.LoginTime) / 1000',
      userId: 'loginUser.UserId',
    });
  }

  /**
   * 登录用户信息
   */
  @Get('/me')
  @PreAuthorize()
  async getInfo(): Promise<Result> {
    const data = await this.accountService.roleAndMenuPerms();
    return result.okData(data);
  }

  /**
   * 登录用户路由信息
   */
  @Get('/router')
  @PreAuthorize()
  async getRouters(): Promise<Result> {
    const buildMenus = await this.accountService.routeMenus();
    return result.okData(buildMenus);
  }

  /**
   * 系统登出
   */
  @Post('/logout')
  @RateLimit({ time: 300, count: 5, limitType: LimitTypeEnum.IP })
  async logout(): Promise<Result> {
    await this.accountService.logout();
    return result.okMsg('退出成功');
  }
}
