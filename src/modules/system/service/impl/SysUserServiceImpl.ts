import { Provide, Inject, Singleton } from '@midwayjs/core';
import { ADMIN_ROLE_ID } from '../../../../framework/constants/AdminConstants';
import { SysUser } from '../../model/SysUser';
import { SysUserPost } from '../../model/SysUserPost';
import { SysUserRole } from '../../model/SysUserRole';
import { SysUserPostRepositoryImpl } from '../../repository/impl/SysUserPostRepositoryImpl';
import { SysUserRepositoryImpl } from '../../repository/impl/SysUserRepositoryImpl';
import { SysUserRoleRepositoryImpl } from '../../repository/impl/SysUserRoleRepositoryImpl';
import { ISysUserService } from '../ISysUserService';

/**
 * 用户 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysUserServiceImpl implements ISysUserService {
  @Inject()
  private sysUserRepository: SysUserRepositoryImpl;

  @Inject()
  private sysUserRoleRepository: SysUserRoleRepositoryImpl;

  @Inject()
  private sysUserPostRepository: SysUserPostRepositoryImpl;

  async selectUserPage(
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    return await this.sysUserRepository.selectUserPage(query, dataScopeSQL);
  }

  async selectUserList(
    sysUser: SysUser,
    dataScopeSQL = ''
  ): Promise<SysUser[]> {
    return await this.sysUserRepository.selectUserList(sysUser, dataScopeSQL);
  }

  async selectAllocatedPage(
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
    return await this.sysUserRepository.selectAllocatedPage(
      query,
      dataScopeSQL
    );
  }
  async selectUserByUserName(userName: string): Promise<SysUser> {
    return await this.sysUserRepository.selectUserByUserName(userName);
  }
  async selectUserById(userId: string): Promise<SysUser> {
    if (!userId) return null;
    const users = await this.sysUserRepository.selectUserById([userId]);
    if (users.length > 0) {
      return users[0];
    }
    return null;
  }

  async checkUniqueUserName(userName: string, userId = ''): Promise<boolean> {
    const sysUser = new SysUser();
    sysUser.userName = userName;
    const uniqueId = await this.sysUserRepository.checkUniqueUser(sysUser);
    if (uniqueId === userId) {
      return true;
    }
    return !uniqueId;
  }

  async checkUniquePhone(phonenumber: string, userId = ''): Promise<boolean> {
    const sysUser = new SysUser();
    sysUser.phonenumber = phonenumber;
    const uniqueId = await this.sysUserRepository.checkUniqueUser(sysUser);
    if (uniqueId === userId) {
      return true;
    }
    return !uniqueId;
  }

  async checkUniqueEmail(email: string, userId = ''): Promise<boolean> {
    const sysUser = new SysUser();
    sysUser.email = email;
    const uniqueId = await this.sysUserRepository.checkUniqueUser(sysUser);
    if (uniqueId === userId) {
      return true;
    }
    return !uniqueId;
  }

  async insertUser(sysUser: SysUser): Promise<string> {
    // 新增用户信息
    const insertId = await this.sysUserRepository.insertUser(sysUser);
    if (insertId) {
      // 新增用户角色信息
      await this.insertUserRole(insertId, sysUser.roleIds);
      // 新增用户岗位信息
      await this.insertUserPost(insertId, sysUser.postIds);
    }
    return insertId;
  }

  async updateUser(sysUser: SysUser): Promise<number> {
    return await this.sysUserRepository.updateUser(sysUser);
  }

  async updateUserAndRolePost(sysUser: SysUser): Promise<number> {
    const { userId, roleIds, postIds } = sysUser;
    // 删除用户与角色关联
    await this.sysUserRoleRepository.deleteUserRole([userId]);
    // 新增用户角色信息
    await this.insertUserRole(userId, roleIds);
    // 删除用户与岗位关联
    await this.sysUserPostRepository.deleteUserPost([userId]);
    // 新增用户岗位信息
    await this.insertUserPost(userId, postIds);
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
    roleIds: string[] = []
  ): Promise<number> {
    if (roleIds && roleIds.length <= 0) return 0;
    const sysUserRoles: SysUserRole[] = [];
    for (const roleId of roleIds) {
      // 管理员角色禁止操作，只能通过配置指定用户ID分配
      if (!roleId || roleId === ADMIN_ROLE_ID) {
        continue;
      }
      sysUserRoles.push(new SysUserRole(userId, roleId));
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
    postIds: string[] = []
  ): Promise<number> {
    if (postIds && postIds.length <= 0) return 0;
    const sysUserPosts: SysUserPost[] = [];
    for (const postId of postIds) {
      if (!postId) {
        continue;
      }
      sysUserPosts.push(new SysUserPost(userId, postId));
    }
    if (sysUserPosts.length <= 0) return 0;
    return await this.sysUserPostRepository.batchUserPost(sysUserPosts);
  }

  async insertAserAuth(userId: string, roleIds: string[]): Promise<void> {
    await this.sysUserRoleRepository.deleteUserRole([userId]);
    await this.insertUserRole(userId, roleIds);
  }

  async deleteUserByIds(userIds: string[]): Promise<number> {
    // 检查是否存在
    const users = await this.sysUserRepository.selectUserById(userIds);
    if (users.length <= 0) {
      throw new Error('没有权限访问用户数据！');
    }
    if (users.length === userIds.length) {
      // 删除用户与角色关联
      await this.sysUserRoleRepository.deleteUserRole(userIds);
      // 删除用户与岗位关联
      await this.sysUserPostRepository.deleteUserPost(userIds);
      // ... 注意其他userId进行关联的表
      // 删除用户
      return await this.sysUserRepository.deleteUserByIds(userIds);
    }
    return 0;
  }
}
