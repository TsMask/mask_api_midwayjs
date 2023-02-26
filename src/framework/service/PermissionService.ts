import { Inject, Provide, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysMenuServiceImpl } from '../../modules/system/service/impl/SysMenuServiceImpl';
import { SysRoleServiceImpl } from '../../modules/system/service/impl/SysRoleServiceImpl';
import { ADMIN_PERMISSION, ADMIN_ROLE_KEY } from '../constants/AdminConstants';

/**
 * 用户权限处理
 *
 * @author TsMask
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class PermissionService {
  @Inject()
  private sysMenuService: SysMenuServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  /**
   * 获取角色数据权限
   *
   * @param userId 用户ID
   * @param isAdmin 是否管理员，默认否
   * @return 角色权限信息
   */
  async getRolePermission(userId: string, isAdmin = false): Promise<string[]> {
    const roles: string[] = [];
    if (isAdmin) {
      roles.push(ADMIN_ROLE_KEY);
    } else {
      const rolePerms = await this.sysRoleService.selectRolePermissionByUserId(
        userId
      );
      roles.push(...rolePerms);
    }
    return [...new Set(roles)];
  }

  /**
   * 获取菜单数据权限
   *
   * @param userId 用户ID
   * @param isAdmin 是否管理员，默认否
   * @return 菜单权限信息
   */
  public async getMenuPermission(
    userId: string,
    isAdmin = false
  ): Promise<string[]> {
    const perms: string[] = [];
    if (isAdmin) {
      perms.push(ADMIN_PERMISSION);
    } else {
      const userPerms = await this.sysMenuService.selectMenuPermsByUserId(
        userId
      );
      perms.push(...userPerms);
    }
    return [...new Set(perms)];
  }
}
