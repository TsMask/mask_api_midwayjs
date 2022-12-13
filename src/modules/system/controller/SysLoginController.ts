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
  private sysLoginService: SysLoginService;

  @Inject()
  private contextService: ContextService;

  @Inject()
  private permissionService: PermissionService;

  @Inject()
  private sysMenuService: SysMenuServiceImpl;

  /**
   * 系统登录
   * @param loginBody 登录参数
   * @returns 返回结果
   */
  @Post('/login')
  async login(@Body() loginBody: LoginBody): Promise<Result> {
    const token = await this.sysLoginService.login(loginBody);
    return Result.ok({
      [TOKEN]: token,
    });
  }

  /**
   * 获取用户信息
   *
   * @returns 返回用户信息
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
   * 获取路由信息
   *
   * @returns 路由信息
   */
  @Get('/getRouters')
  @PreAuthorize()
  async getRouters(): Promise<Result> {
    const userId = this.contextService.getUserId();
    const isSuperAdmin = this.contextService.isSuperAdmin(userId);
    const menus = await this.sysMenuService.selectMenuTreeByUserId(
      isSuperAdmin ? null : userId
    );
    const buildMenus = await this.sysMenuService.buildRouteMenus(menus);
    return Result.okData(buildMenus);
  }

  /**
   * 系统登出
   * @returns 返回结果
   */
  @Post('/logout')
  @PreAuthorize()
  async logout(): Promise<Result> {
    const loginUser = this.contextService.getLoginUser();
    this.sysLoginService.logout(loginUser.uuid);
    return Result.okMsg('退出成功');
  }
}
