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

  async selectUserPage(query: any, dataScopeSQL = ''): Promise<rowPages> {
    return await this.sysUserRepository.selectUserPage(query, dataScopeSQL);
  }

  async selectUserList(
    sysUser: SysUser,
    dataScopeSQL = ''
  ): Promise<SysUser[]> {
    return await this.sysUserRepository.selectUserList(sysUser, dataScopeSQL);
  }

  async selectAllocatedPage(
    roleId: string,
    allocated: boolean,
    query: any,
    dataScopeSQL = ''
  ): Promise<rowPages> {
    return await this.sysUserRepository.selectAllocatedPage(
      roleId,
      allocated,
      query,
      dataScopeSQL
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
      // 新增用户与角色管理
      await this.insertUserRole(insertId, sysUser.roleIds);
      // 新增用户与岗位管理
      await this.insertUserPost(insertId, sysUser.postIds);
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
    if (roleIds && roleIds.length <= 0) return 0;
    const sysUserRoles: SysUserRole[] = [];
    for (const roleId of roleIds) {
      if (!roleId) continue;
      const ur = new SysUserRole();
      ur.userId = userId;
      ur.roleId = roleId.trim();
      sysUserRoles.push(ur);
    }
    if (sysUserRoles.length <= 0) return 0;
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
    if (postIds && postIds.length <= 0) return 0;
    const sysUserPosts: SysUserPost[] = [];
    for (const postId of postIds) {
      if (!postId) continue;
      const up = new SysUserPost();
      up.userId = userId;
      up.postId = postId.trim();
      sysUserPosts.push(up);
    }
    if (sysUserPosts.length <= 0) return 0;
    return await this.sysUserPostRepository.batchUserPost(sysUserPosts);
  }

  async insertAserAuth(userId: string, roleIds: string[]): Promise<void> {
    await this.sysUserRoleRepository.deleteUserRole([userId]);
    await this.insertUserRole(userId, roleIds);
  }

  async deleteUserByIds(userIds: string[]): Promise<number> {
    // 遍历检查是否都存在
    for (const userId of userIds) {
      // 检查是否存在
      const user = await this.sysUserRepository.selectUserById(userId);
      if (!user) {
        throw new Error('没有权限访问用户数据！');
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