import { Controller, Body, Post, Get, Inject } from '@midwayjs/decorator';
import { TOKEN } from '../../../common/constants/CommonConstants';
import { Result } from '../../../framework/core/Result';
import { LoginBody } from '../../../framework/core/vo/LoginBody';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { PermissionService } from '../../../framework/service/PermissionService';
import { SysLoginService } from '../../../framework/service/SysLoginService';
import { SysMenuServiceImpl } from '../service/impl/SysMenuServiceImpl';

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
  async login(@Body() loginBody: LoginBody): Promise<Result> {
    const token = await this.sysLoginService.login(loginBody);
    return Result.ok({
      [TOKEN]: token,
    });
  }

  /**
   * 登录用户信息
   */
  @Get('/getInfo')
  @PreAuthorize()
  async getInfo(): Promise<Result> {
    const user = this.contextService.getSysUser();
    // 角色集合
    const roles = await this.permissionService.getRolePermission(user);
    // 权限集合
    const permissions = await this.permissionService.getMenuPermission(user);
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
      isAdmin ? undefined : userId
    );
    const buildMenus = await this.sysMenuService.buildRouteMenus(menus);
    return Result.okData(buildMenus);
  }

  /**
   * 系统登出
   */
  @Post('/logout')
  async logout(): Promise<Result> {
    await this.sysLoginService.logout();
    return Result.okMsg('退出成功');
  }
}
