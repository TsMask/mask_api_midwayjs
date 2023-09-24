import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { SysRole } from '../../model/SysRole';
import { SysRoleDept } from '../../model/SysRoleDept';
import { SysRoleMenu } from '../../model/SysRoleMenu';
import { SysUserRole } from '../../model/SysUserRole';
import { SysRoleDeptRepositoryImpl } from '../../repository/impl/SysRoleDeptRepositoryImpl';
import { SysRoleMenuRepositoryImpl } from '../../repository/impl/SysRoleMenuRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { SysUserRoleRepositoryImpl } from '../../repository/impl/SysUserRoleRepositoryImpl';
import { ISysRoleService } from '../ISysRoleService';

/**
 * 角色 服务层实现
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysRoleServiceImpl implements ISysRoleService {
  @Inject()
  private sysRoleRepository: SysRoleRepositoryImpl;

  @Inject()
  private sysUserRoleRepository: SysUserRoleRepositoryImpl;

  @Inject()
  private sysRoleMenuRepository: SysRoleMenuRepositoryImpl;

  @Inject()
  private sysRoleDeptRepository: SysRoleDeptRepositoryImpl;

  async selectRolePage(
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    return await this.sysRoleRepository.selectRolePage(query, dataScopeSQL);
  }

  async selectRoleList(
    sysRole: SysRole,
    dataScopeSQL = ''
  ): Promise<SysRole[]> {
    return await this.sysRoleRepository.selectRoleList(sysRole, dataScopeSQL);
  }

  async selectRoleListByUserId(userId: string): Promise<SysRole[]> {
    return await this.sysRoleRepository.selectRoleListByUserId(userId);
  }

  async selectRoleById(roleId: string): Promise<SysRole> {
    if (!roleId) return null;
    const roles = await this.sysRoleRepository.selectRoleByIds([roleId]);
    if (roles.length > 0) {
      return roles[0];
    }
    return null;
  }

  async checkUniqueRoleName(roleName: string, roleId = ''): Promise<boolean> {
    const sysRole = new SysRole();
    sysRole.roleName = roleName;
    const uniqueId = await this.sysRoleRepository.checkUniqueRole(sysRole);
    if (uniqueId === roleId) {
      return true;
    }
    return !uniqueId;
  }

  async checkUniqueRoleKey(roleKey: string, roleId = ''): Promise<boolean> {
    const sysRole = new SysRole();
    sysRole.roleKey = roleKey;
    const uniqueId = await this.sysRoleRepository.checkUniqueRole(sysRole);
    if (uniqueId === roleId) {
      return true;
    }
    return !uniqueId;
  }

  async insertRole(sysRole: SysRole): Promise<string> {
    const insertId = await this.sysRoleRepository.insertRole(sysRole);
    if (insertId && sysRole.menuIds) {
      await this.insertRoleMenu(insertId, sysRole.menuIds);
    }
    return insertId;
  }

  async updateRole(sysRole: SysRole): Promise<number> {
    // 修改角色信息
    const rows = await this.sysRoleRepository.updateRole(sysRole);
    if (rows > 0) {
      // 删除角色与菜单关联
      await this.sysRoleMenuRepository.deleteRoleMenu([sysRole.roleId]);
      if (sysRole.menuIds.length > 0) {
        await this.insertRoleMenu(sysRole.roleId, sysRole.menuIds);
      }
    }
    return rows;
  }

  /**
   * 新增角色菜单信息
   *
   * @param sysRole 角色对象
   */
  private async insertRoleMenu(
    roleId: string,
    menuIds: string[]
  ): Promise<number> {
    if (menuIds && menuIds.length <= 0) return 0;
    const sysRoleMenus: SysRoleMenu[] = menuIds.map(menuId => {
      if (menuId) {
        return new SysRoleMenu(roleId, menuId);
      }
    });
    if (sysRoleMenus.length <= 0) return 0;
    return await this.sysRoleMenuRepository.batchRoleMenu(sysRoleMenus);
  }

  async authDataScope(sysRole: SysRole): Promise<number> {
    // 修改角色信息
    let rows = await this.sysRoleRepository.updateRole(sysRole);
    const roleId = sysRole.roleId;
    // 删除角色与部门关联
    await this.sysRoleDeptRepository.deleteRoleDept([roleId]);
    // 新增角色和部门信息
    if (
      sysRole.dataScope === '2' &&
      sysRole.deptIds &&
      sysRole.deptIds.length > 0
    ) {
      const sysRoleDepts: SysRoleDept[] = sysRole.deptIds.map(deptId => {
        if (deptId) {
          return new SysRoleDept(roleId, deptId);
        }
      });
      rows += await this.sysRoleDeptRepository.batchRoleDept(sysRoleDepts);
    }
    return rows;
  }

  async deleteRoleByIds(roleIds: string[]): Promise<number> {
    const roles = await this.sysRoleRepository.selectRoleByIds(roleIds);
    if (roles.length <= 0) {
      throw new Error('没有权限访问角色数据！');
    }
    for (const role of roles) {
      // 检查是否为已删除
      if (role.delFlag === '1') {
        throw new Error(`${role.roleName} 角色信息已经删除！`);
      }
      // 检查分配用户
      const useCount = await this.sysUserRoleRepository.countUserRoleByRoleId(
        role.roleId
      );
      if (useCount > 0) {
        throw new Error(`【${role.roleName}】已分配给用户,不能删除`);
      }
    }
    if (roles.length === roleIds.length) {
      // 删除角色与菜单关联
      await this.sysRoleMenuRepository.deleteRoleMenu(roleIds);
      // 删除角色与部门关联
      await this.sysRoleDeptRepository.deleteRoleDept(roleIds);
      return await this.sysRoleRepository.deleteRoleByIds(roleIds);
    }
    return 0;
  }

  async deleteAuthUsers(roleId: string, userIds: string[]): Promise<number> {
    return await this.sysUserRoleRepository.deleteUserRoleByRoleId(
      roleId,
      userIds
    );
  }

  async insertAuthUsers(roleId: string, userIds: string[]): Promise<number> {
    if (userIds && userIds.length <= 0) return 0;
    // 新增用户与角色管理
    const sysUserRoles: SysUserRole[] = userIds.map(userId => {
      if (userId) {
        return new SysUserRole(userId, roleId);
      }
    });
    if (sysUserRoles.length <= 0) return 0;
    return await this.sysUserRoleRepository.batchUserRole(sysUserRoles);
  }
}
