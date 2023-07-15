import { Controller, Body, Post, Get, Inject } from '@midwayjs/decorator';
import { TOKEN_RESPONSE_FIELD } from '../../../framework/constants/TokenConstants';
import { Result } from '../../../framework/vo/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { LoginBodyVo } from '../model/LoginBodyVo';
import { AccountService } from '../service/AccountService';

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
    if (!username || !password || !code || !uuid) return Result.err();
    await this.accountService.validateCaptcha(username, code, uuid);
    const token = await this.accountService.loginByUsername(username, password);
    return Result.okData({
      [TOKEN_RESPONSE_FIELD]: token,
    });
  }

  /**
   * 登录用户信息
   */
  @Get('/getInfo')
  @PreAuthorize()
  async getInfo(): Promise<Result> {
    const data = await this.accountService.roleAndMenuPerms();
    return Result.okData(data);
  }

  /**
   * 登录用户路由信息
   */
  @Get('/getRouters')
  @PreAuthorize()
  async getRouters(): Promise<Result> {
    const buildMenus = await this.accountService.routeMenus();
    return Result.okData(buildMenus);
  }

  /**
   * 系统登出
   */
  @Post('/logout')
  @RateLimit({ time: 300, count: 5, limitType: LimitTypeEnum.IP })
  async logout(): Promise<Result> {
    await this.accountService.logout();
    return Result.okMsg('退出成功');
  }
}
