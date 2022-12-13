import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SysUser } from '../../../../framework/core/model/SysUser';
import { SysUserPost } from '../../model/SysUserPost';
import { SysUserRole } from '../../model/SysUserRole';
import { SysPostRepositoryImpl } from '../../repository/impl/SysPostRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { SysUserPostRepositoryImpl } from '../../repository/impl/SysUserPostRepositoryImpl';
import { SysUserRepositoryImpl } from '../../repository/impl/SysUserRepositoryImpl';
import { SysUserRoleRepositoryImpl } from '../../repository/impl/SysUserRoleRepositoryImpl';
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
  private sysUserRoleRepository: SysUserRoleRepositoryImpl;

  @Inject()
  private sysPostRepository: SysPostRepositoryImpl;

  @Inject()
  private sysUserPostRepository: SysUserPostRepositoryImpl;

  async selectUserPage(query: any): Promise<rowPages> {
    return await this.sysUserRepository.selectUserPage(query);
  }

  async selectUserList(sysUser: SysUser): Promise<SysUser[]> {
    return await this.sysUserRepository.selectUserList(sysUser);
  }

  async selectAllocatedPage(
    roleId: string,
    unallocated = false,
    query?: any
  ): Promise<rowPages> {
    return await this.sysUserRepository.selectAllocatedPage(
      roleId,
      unallocated,
      query
    );
  }
  async selectUserByUserName(userName: string): Promise<SysUser> {
    return await this.sysUserRepository.selectUserByUserName(userName);
  }
  async selectUserById(userId: string): Promise<SysUser> {
    return await this.sysUserRepository.selectUserById(userId);
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

  async checkUniqueUserName(sysUser: SysUser): Promise<boolean> {
    const userId = await this.sysUserRepository.checkUniqueUserName(
      sysUser.userName
    );
    // 用户信息与查询得到用户ID一致
    if (userId && sysUser.userId === userId) {
      return true;
    }
    return !userId;
  }
  async checkUniquePhone(sysUser: SysUser): Promise<boolean> {
    const userId = await this.sysUserRepository.checkUniquePhone(
      sysUser.phonenumber
    );
    // 用户信息与查询得到用户ID一致
    if (userId && sysUser.userId === userId) {
      return true;
    }
    return !userId;
  }
  async checkUniqueEmail(sysUser: SysUser): Promise<boolean> {
    const userId = await this.sysUserRepository.checkUniqueEmail(sysUser.email);
    // 用户信息与查询得到用户ID一致
    if (userId && sysUser.userId === userId) {
      return true;
    }
    return !userId;
  }
  checkUserAllowed(sysUser: SysUser): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  checkUserDataScope(userId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async insertUser(sysUser: SysUser): Promise<string> {
    // 新增用户信息
    const insertId = await this.sysUserRepository.insertUser(sysUser);
    if (insertId) {
      sysUser.userId = insertId;
      // 新增用户与角色管理
      await this.insertUserRole(sysUser.userId, sysUser.roleIds);
      // 新增用户与岗位管理
      await this.insertUserPost(sysUser.userId, sysUser.postIds);
    }
    return insertId;
  }
  registerUser(sysUser: SysUser): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  async updateUser(sysUser: SysUser): Promise<number> {
    return await this.sysUserRepository.updateUser(sysUser);
  }
  async updateUserAndRolePost(sysUser: SysUser): Promise<number> {
    const userId = sysUser.userId;
    // 删除用户与角色关联
    await this.sysUserRoleRepository.deleteUserRole([userId]);
    // 新增用户与角色管理
    await this.insertUserRole(userId, sysUser.roleIds);
    // 删除用户与岗位关联
    await this.sysUserPostRepository.deleteUserPost([userId]);
    // 新增用户与岗位管理
    await this.insertUserPost(userId, sysUser.postIds);
    return await this.sysUserRepository.updateUser(sysUser);
  }
  /**
   * 新增用户角色信息
   *
   * @param userId 用户ID
   * @param roleIds 角色组
   */
  private async insertUserRole(
    userId: string,
    roleIds: string[]
  ): Promise<number> {
    const sysUserRoles: SysUserRole[] = [];
    for (const roleId of roleIds) {
      const ur = new SysUserRole();
      ur.userId = userId;
      ur.roleId = roleId;
      sysUserRoles.push(ur);
    }
    return await this.sysUserRoleRepository.batchUserRole(sysUserRoles);
  }
  /**
   * 新增用户岗位信息
   *
   * @param userId 用户ID
   * @param postIds 岗位组
   */
  private async insertUserPost(
    userId: string,
    postIds: string[]
  ): Promise<number> {
    if (postIds.length > 0) {
      const sysUserPosts: SysUserPost[] = [];
      for (const postId of postIds) {
        const up = new SysUserPost();
        up.userId = userId;
        up.postId = postId;
        sysUserPosts.push(up);
      }
      return await this.sysUserPostRepository.batchUserPost(sysUserPosts);
    }
    return 0;
  }
  async insertAserAuth(userId: string, roleIds: string[]): Promise<void> {
    await this.sysUserRoleRepository.deleteUserRole([userId]);
    if (roleIds.length > 0) {
      await this.insertUserRole(userId, roleIds);
    }
  }
  async updateUserProfile(sysUser: SysUser): Promise<number> {
    return await this.sysUserRepository.updateUser(sysUser);
  }
  async updateUserAvatar(userName: string, avatar: string): Promise<number> {
    return await this.sysUserRepository.updateUserAvatar(userName, avatar);
  }

  async deleteUserByIds(userIds: string[]): Promise<number> {
    // 遍历检查是否都存在
    for (const userId of userIds) {
      const user = await this.selectUserById(userId);
      if (!user) {
        return 0;
      }
    }
    // 删除用户与角色关联
    await this.sysUserRoleRepository.deleteUserRole(userIds);
    // 删除用户与岗位关联
    await this.sysUserPostRepository.deleteUserPost(userIds);
    return await this.sysUserRepository.deleteUserByIds(userIds);
  }
  importUser(
    userList: SysUser[],
    isUpdateSupport: boolean,
    operName: string
  ): Promise<string> {
    throw new Error('Method not implemented.');
  }
}
