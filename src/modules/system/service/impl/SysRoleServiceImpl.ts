import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysRole } from '../../../../framework/core/model/SysRole';
import { FlakeIdgenService } from '../../../../framework/service/FlakeIdgenService';
import { SysRoleMenu } from '../../model/SysRoleMenu';
import { SysUserRole } from '../../model/SysUserRole';
import { SysRoleDeptRepositoryImpl } from '../../repository/impl/SysRoleDeptRepositoryImpl';
import { SysRoleMenuRepositoryImpl } from '../../repository/impl/SysRoleMenuRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
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
  private sysRoleMenuRepository: SysRoleMenuRepositoryImpl;

  @Inject()
  private sysRoleDeptRepository: SysRoleDeptRepositoryImpl;

  @Inject()
  private flakeIdgenService: FlakeIdgenService;

  async selectRolePage(query: any): Promise<rowPages> {
    return await this.sysRoleRepository.selectRolePage(query);
  }

  async selectRoleList(sysRole: SysRole): Promise<SysRole[]> {
    return await this.sysRoleRepository.selectRoleList(sysRole);
  }
  selectRolesByUserId(userId: string): Promise<SysRole[]> {
    throw new Error('Method not implemented.');
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
    return roleId == sysRole.roleId; // 角色信息与查询得到角色ID一致
  }
  async checkUniqueRoleKey(sysRole: SysRole): Promise<boolean> {
    const roleId = await this.sysRoleRepository.checkUniqueRoleName(
      sysRole.roleKey
    );
    return roleId == sysRole.roleId; // 角色信息与查询得到角色ID一致
  }
  checkRoleAllowed(sysRole: SysRole): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  checkRoleDataScope(roleId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  countUserRoleByRoleId(roleId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }

  async insertRole(sysRole: SysRole): Promise<number> {
    // 生成ID
    sysRole.roleId = await this.flakeIdgenService.getString();
    // 新增角色信息
    const rows = await this.sysRoleRepository.insertRole(sysRole);
    if (rows > 0) {
      await this.insertRoleMenu(sysRole);
      return rows;
    }
    return rows;
  }

  async updateRole(sysRole: SysRole): Promise<number> {
    // 修改角色信息
    const rows = await this.sysRoleRepository.updateRole(sysRole);
    if (rows > 0) {
      // 删除角色与菜单关联
      await this.sysRoleMenuRepository.deleteRoleMenuByRoleId(sysRole.roleId);
      await this.insertRoleMenu(sysRole);
      return rows;
    }
    return 0;
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
  authDataScope(sysRole: SysRole): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteRoleById(roleId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async deleteRoleByIds(roleIds: string[]): Promise<number> {
    for (const roleId of roleIds) {
      // 检查是否管理员角色
      if (roleId === '1') {
        throw new Error('不允许操作超级管理员角色');
      }
      // 检查是否存在
      const role = await this.selectRoleById(roleId);
      if (!role) {
        throw new Error('没有权限访问角色数据！');
      }
      const useCount = await this.countUserRoleByRoleId(roleId);
      if (useCount > 0) {
        throw new Error(`【${role.roleName}】已分配,不能删除`);
      }
    }

    // 删除角色与菜单关联
    await this.sysRoleMenuRepository.deleteRoleMenu(roleIds);
    // 删除角色与部门关联
    await this.sysRoleDeptRepository.deleteRoleDept(roleIds);
    return await this.sysRoleRepository.deleteRoleByIds(roleIds);
  }
  deleteAuthUser(sysUserRole: SysUserRole): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteAuthUsers(roleId: string, userIds: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  insertAuthUsers(roleId: string, userIds: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
}
