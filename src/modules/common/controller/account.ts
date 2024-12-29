import { Controller, Body, Post, Get, Inject } from '@midwayjs/core';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { AccountService } from '../service/account';
import { LoginBody } from '../model/login-body';
import { Resp } from '../../../framework/resp/api';

/**
 * 账号身份操作处理
 */
@Controller()
export class AccountController {
  /**
   * 账号身份操作服务
   */
  @Inject()
  private accountService: AccountService;

  /**
   * 系统登录
   * @param LoginBody 登录信息
   * @returns
   */
  @Post('/login')
  @RateLimit({ time: 300, count: 20, limitType: LimitTypeEnum.IP })
  async login(@Body() LoginBody: LoginBody): Promise<Resp> {
    const { username, password, code, uuid } = LoginBody;
    if (!username || !password) return Resp.err();
    await this.accountService.validateCaptcha(username, code, uuid);
    const tokenStr = await this.accountService.loginByUsername(
      username,
      password
    );
    return Resp.okData({
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
  async getInfo(): Promise<Resp> {
    const data = await this.accountService.roleAndMenuPerms();
    return Resp.okData(data);
  }

  /**
   * 登录用户路由信息
   */
  @Get('/router')
  @PreAuthorize()
  async getRouters(): Promise<Resp> {
    const buildMenus = await this.accountService.routeMenus();
    return Resp.okData(buildMenus);
  }

  /**
   * 系统登出
   */
  @Post('/logout')
  @RateLimit({ time: 300, count: 5, limitType: LimitTypeEnum.IP })
  async logout(): Promise<Resp> {
    await this.accountService.logout();
    return Resp.okMsg('退出成功');
  }
}
