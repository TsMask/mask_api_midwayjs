import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SysUser } from '../../../../framework/core/model/SysUser';
import { SysPostRepositoryImpl } from '../../repository/impl/SysPostRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { SysUserRepositoryImpl } from '../../repository/impl/SysUserRepositoryImpl';
import { ISysUserService } from '../ISysUserService';

/**
 * 用户 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysUserServiceImpl implements ISysUserService {
  @Inject()
  private sysUserRepository: SysUserRepositoryImpl;

  @Inject()
  private sysRoleRepository: SysRoleRepositoryImpl;

  @Inject()
  private sysPostRepository: SysPostRepositoryImpl;

  selectUserList(sysUser: SysUser): Promise<[SysUser[], number]> {
    throw new Error('Method not implemented.');
  }
  selectAllocatedList(sysUser: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }
  selectUnallocatedList(sysUser: SysUser): Promise<SysUser[]> {
    throw new Error('Method not implemented.');
  }
  async selectUserByUserName(userName: string): Promise<SysUser> {
    return await this.sysUserRepository.selectUserByUserName(userName);
  }
  selectUserById(userId: string): Promise<SysUser> {
    throw new Error('Method not implemented.');
  }

  async selectUserRoleGroup(userName: string): Promise<string[]> {
    const sysRoles = await this.sysRoleRepository.selectRolesByUserName(
      userName
    );
    if (sysRoles && sysRoles.length > 0) {
      return sysRoles.map(item => item.roleName);
    }
    return [];
  }

  async selectUserPostGroup(userName: string): Promise<string[]> {
    const sysPosts = await this.sysPostRepository.selectPostsByUserName(
      userName
    );
    if (sysPosts && sysPosts.length > 0) {
      return sysPosts.map(item => item.postName);
    }
    return [];
  }

  checkUniqueUserName(userName: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  checkUniquePhone(sysUser: SysUser): Promise<string> {
    throw new Error('Method not implemented.');
  }
  checkUniqueEmail(sysUser: SysUser): Promise<string> {
    throw new Error('Method not implemented.');
  }
  checkUserAllowed(sysUser: SysUser): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  checkUserDataScope(userId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  insertUser(sysUser: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  registerUser(sysUser: SysUser): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  updateUser(sysUser: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  insertAserAuth(userId: string, role_ids: string[]): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  updateUserStatus(sysUser: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async updateUserProfile(sysUser: SysUser): Promise<number> {
    return await this.sysUserRepository.updateUser(sysUser);
  }
  updateUserAvatar(userName: string, avatar: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  resetPwd(sysUser: SysUser): Promise<number> {
    throw new Error('Method not implemented.');
  }
  resetUserPwd(userName: string, password: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteUserById(userId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteUserByIds(userIds: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  importUser(
    userList: SysUser[],
    isUpdateSupport: boolean,
    operName: string
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
