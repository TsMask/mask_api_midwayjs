import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysRole } from '../../../../framework/core/model/SysRole';
import { SysUserRole } from '../../model/SysUserRole';
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
  checkUniqueRoleName(sysRole: SysRole): Promise<string> {
    throw new Error('Method not implemented.');
  }
  checkUniqueRoleKey(sysRole: SysRole): Promise<string> {
    throw new Error('Method not implemented.');
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
  insertRole(sysRole: SysRole): Promise<number> {
    throw new Error('Method not implemented.');
  }
  updateRole(sysRole: SysRole): Promise<number> {
    throw new Error('Method not implemented.');
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
  deleteRoleByIds(roleIds: string): Promise<number> {
    throw new Error('Method not implemented.');
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
