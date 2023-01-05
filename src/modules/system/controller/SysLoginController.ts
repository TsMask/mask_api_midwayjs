import { Controller, Body, Post, Get, Inject } from '@midwayjs/decorator';
import { TOKEN_RESPONSE_FIELD } from '../../../framework/constants/TokenConstants';
import { Result } from '../../../framework/model/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { PermissionService } from '../../../framework/service/PermissionService';
import { SysLoginService } from '../../../framework/service/SysLoginService';
import { LoginBodyVo } from '../model/vo/LoginBodyVo';
import { SysMenuServiceImpl } from '../service/impl/SysMenuServiceImpl';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';

/**
 * 登录验证
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller()
export class SysLoginController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysLoginService: SysLoginService;

  @Inject()
  private permissionService: PermissionService;

  @Inject()
  private sysMenuService: SysMenuServiceImpl;

  /**
   * 系统登录
   */
  @Post('/login')
  @RateLimit({ time: 300, count: 20, limitType: LimitTypeEnum.IP })
  async login(@Body() loginBodyVo: LoginBodyVo): Promise<Result> {
    const token = await this.sysLoginService.login(loginBodyVo);
    return Result.ok({
      [TOKEN_RESPONSE_FIELD]: token,
    });
  }

  /**
   * 登录用户信息
   */
  @Get('/getInfo')
  @PreAuthorize()
  async getInfo(): Promise<Result> {
    const user = this.contextService.getSysUser();
    // 管理员拥有所有权限
    const isAdmin = this.contextService.isAdmin(user.userId);
    // 角色集合
    const roles = await this.permissionService.getRolePermission(
      user.userId,
      isAdmin
    );
    // 权限集合
    const permissions = await this.permissionService.getMenuPermission(
      user.userId,
      isAdmin
    );
    return Result.ok({
      permissions: permissions,
      roles: roles,
      user: user,
    });
  }

  /**
   * 登录用户路由信息
   */
  @Get('/getRouters')
  @PreAuthorize()
  async getRouters(): Promise<Result> {
    const userId = this.contextService.getUserId();
    const isAdmin = this.contextService.isAdmin(userId);
    const menus = await this.sysMenuService.selectMenuTreeByUserId(
      isAdmin ? null : userId
    );
    const buildMenus = await this.sysMenuService.buildRouteMenus(menus);
    return Result.okData(buildMenus);
  }

  /**
   * 系统登出
   */
  @Post('/logout')
  @RateLimit({ time: 300, count: 5, limitType: LimitTypeEnum.IP })
  async logout(): Promise<Result> {
    await this.sysLoginService.logout();
    return Result.okMsg('退出成功');
  }
}
