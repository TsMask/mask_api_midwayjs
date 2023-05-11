import { Inject, Provide, Singleton } from '@midwayjs/decorator';
import { SysMenuServiceImpl } from '../../modules/system/service/impl/SysMenuServiceImpl';
import { SysRoleServiceImpl } from '../../modules/system/service/impl/SysRoleServiceImpl';
import { ADMIN_PERMISSION, ADMIN_ROLE_KEY } from '../constants/AdminConstants';

/**
 * 用户权限处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
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
    let roles = new Set<string>();
    if (isAdmin) {
      roles.add(ADMIN_ROLE_KEY);
    } else {
      const rolePerms = await this.sysRoleService.selectRolePermissionByUserId(
        userId
      );
      roles = new Set<string>(rolePerms);
    }
    return [...roles];
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
    let perms = new Set<string>();
    if (isAdmin) {
      perms.add(ADMIN_PERMISSION);
    } else {
      const userPerms = await this.sysMenuService.selectMenuPermsByUserId(
        userId
      );
      perms = new Set<string>(userPerms);
    }
    return [...perms];
  }
}
