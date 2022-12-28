import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysRole } from '../../../../framework/core/model/SysRole';
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
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
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

  async selectRolesByUserId(userId: string): Promise<SysRole[]> {
    const roles = await this.sysRoleRepository.selectRoleList(new SysRole());
    const userRoles = await this.sysRoleRepository.selectRolePermissionByUserId(
      userId
    );
    for (const role of roles) {
      for (const userRole of userRoles) {
        if (role.roleId === userRole.roleId) {
          role.flag = true;
          break;
        }
      }
    }
    return roles;
  }

  async selectRolePermissionByUserId(userId: string): Promise<string[]> {
    const perms = await this.sysRoleRepository.selectRolePermissionByUserId(
      userId
    );
    const role_arr: string[] = [];
    for (const perm of perms) {
      if (perm && perm.roleKey) {
        role_arr.push(...perm.roleKey.trim().split(','));
      }
    }
    return [...new Set(role_arr)];
  }

  selectRoleListByUserId(userId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }
  async selectRoleById(roleId: string): Promise<SysRole> {
    return await this.sysRoleRepository.selectRoleById(roleId);
  }

  async checkUniqueRoleName(sysRole: SysRole): Promise<boolean> {
    const roleId = await this.sysRoleRepository.checkUniqueRoleName(
      sysRole.roleName
    );
    // 角色信息与查询得到角色ID一致
    if (roleId && sysRole.roleId === roleId) {
      return true;
    }
    return !roleId;
  }

  async checkUniqueRoleKey(sysRole: SysRole): Promise<boolean> {
    const roleId = await this.sysRoleRepository.checkUniqueRoleName(
      sysRole.roleKey
    );
    // 角色信息与查询得到角色ID一致
    if (roleId && sysRole.roleId === roleId) {
      return true;
    }
    return !roleId;
  }

  checkRoleAllowed(sysRole: SysRole): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  checkRoleDataScope(roleId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async countUserRoleByRoleId(roleId: string): Promise<number> {
    return await this.sysUserRoleRepository.countUserRoleByRoleId(roleId);
  }

  async insertRole(sysRole: SysRole): Promise<string> {
    const insertId = await this.sysRoleRepository.insertRole(sysRole);
    if (insertId) {
      sysRole.roleId = insertId;
      await this.insertRoleMenu(sysRole);
      return insertId;
    }
    return insertId;
  }

  async updateRole(sysRole: SysRole): Promise<number> {
    // 修改角色信息
    const rows = await this.sysRoleRepository.updateRole(sysRole);
    if (rows > 0 && sysRole.menuIds) {
      // 删除角色与菜单关联
      await this.sysRoleMenuRepository.deleteRoleMenuByRoleId(sysRole.roleId);
      await this.insertRoleMenu(sysRole);
      return rows;
    }
    return rows;
  }

  /**
   * 新增角色菜单信息
   *
   * @param sysRole 角色对象
   */
  private async insertRoleMenu(sysRole: SysRole): Promise<number> {
    const sysRoleMenus: SysRoleMenu[] = [];
    for (const menuId of sysRole.menuIds) {
      const rm = new SysRoleMenu();
      rm.roleId = sysRole.roleId;
      rm.menuId = menuId;
      sysRoleMenus.push(rm);
    }
    if (sysRoleMenus.length > 0) {
      return await this.sysRoleMenuRepository.batchRoleMenu(sysRoleMenus);
    }
    return 0;
  }
  updateRoleStatus(sysRole: SysRole): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async authDataScope(sysRole: SysRole): Promise<number> {
    const roleId = sysRole.roleId;
    // 删除角色与部门关联
    await this.sysRoleDeptRepository.deleteRoleDept([roleId]);
    // 新增角色和部门信息（数据权限）
    if (sysRole.deptIds && sysRole.deptIds.length > 0) {
      // 新增角色与部门（数据权限）管理
      const sysRoleDepts: SysRoleDept[] = [];
      for (const deptId of sysRole.deptIds) {
        const rd = new SysRoleDept();
        rd.roleId = roleId;
        rd.deptId = deptId;
        sysRoleDepts.push(rd);
      }
      await this.sysRoleDeptRepository.batchRoleDept(sysRoleDepts);
    }
    // 修改角色信息
    return await this.sysRoleRepository.updateRole(sysRole);
  }
  deleteRoleById(roleId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async deleteRoleByIds(roleIds: string[]): Promise<number> {
    for (const roleId of roleIds) {
      // 检查是否管理员角色
      if (roleId === '1') {
        throw new Error('不允许操作管理员角色');
      }
      // 检查是否存在
      const role = await this.selectRoleById(roleId);
      if (!role) {
        throw new Error('没有权限访问角色数据！');
      }
      const useCount = await this.countUserRoleByRoleId(roleId);
      if (useCount > 0) {
        throw new Error(`【${role.roleName}】已分配给用户,不能删除`);
      }
    }

    // 删除角色与菜单关联
    await this.sysRoleMenuRepository.deleteRoleMenu(roleIds);
    // 删除角色与部门关联
    await this.sysRoleDeptRepository.deleteRoleDept(roleIds);
    return await this.sysRoleRepository.deleteRoleByIds(roleIds);
  }

  async deleteAuthUsers(roleId: string, userIds: string[]): Promise<number> {
    return await this.sysUserRoleRepository.deleteUserRoleInfos(
      roleId,
      userIds
    );
  }
  async insertAuthUsers(roleId: string, userIds: string[]): Promise<number> {
    // 新增用户与角色管理
    const sysUserRoles: SysUserRole[] = [];
    for (const userId of userIds) {
      const ur = new SysUserRole();
      ur.userId = userId;
      ur.roleId = roleId;
      sysUserRoles.push(ur);
    }
    return await this.sysUserRoleRepository.batchUserRole(sysUserRoles);
  }
}
