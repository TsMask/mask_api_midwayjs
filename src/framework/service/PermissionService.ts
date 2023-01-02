import { Inject, Provide } from '@midwayjs/decorator';
import { SysMenuServiceImpl } from '../../modules/system/service/impl/SysMenuServiceImpl';
import { SysRoleServiceImpl } from '../../modules/system/service/impl/SysRoleServiceImpl';
import { ADMIN_PERMISSION, ADMIN_ROLE_KEY } from '../constants/AdminConstants';
import { SysUser } from '../core/model/SysUser';
import { ContextService } from './ContextService';

/**
 * 用户权限处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class PermissionService {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysMenuService: SysMenuServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  /**
   * 获取角色数据权限
   *
   * @param user 用户
   * @return 角色权限信息
   */
  public async getRolePermission(user: SysUser): Promise<string[]> {
    const roles: string[] = [];
    // 管理员拥有所有权限
    const isAdmin = this.contextService.isAdmin(user.userId);
    if (isAdmin) {
      roles.push(ADMIN_ROLE_KEY);
    } else {
      const rolePerms = await this.sysRoleService.selectRolePermissionByUserId(
        user.userId
      );
      roles.push(...rolePerms);
    }
    return [...new Set(roles)];
  }

  /**
   * 获取菜单数据权限
   *
   * @param user 用户信息
   * @return 菜单权限信息
   */
  public async getMenuPermission(user: SysUser): Promise<string[]> {
    const perms: string[] = [];
    // 管理员拥有所有权限
    const isAdmin = this.contextService.isAdmin(user.userId);
    if (isAdmin) {
      perms.push(ADMIN_PERMISSION);
    } else {
      const roles = user.roles;
      if (roles && roles.length) {
        // 多角色设置permissions属性，以便数据权限匹配权限
        for (const role of roles) {
          const rolePerms = await this.sysMenuService.selectMenuPermsByRoleId(
            role.roleId
          );
          perms.push(...rolePerms);
        }
      } else {
        const userPerms = await this.sysMenuService.selectMenuPermsByUserId(
          user.userId
        );
        perms.push(...userPerms);
      }
    }
    return [...new Set(perms)];
  }
}
