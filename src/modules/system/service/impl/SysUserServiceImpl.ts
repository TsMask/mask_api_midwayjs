import { Provide, Inject, Singleton } from '@midwayjs/core';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../../framework/constants/CommonConstants';
import {
  validEmail,
  validMobile,
} from '../../../../framework/utils/RegularUtils';
import { ADMIN_ROLE_ID } from '../../../../framework/constants/AdminConstants';
import { SysUser } from '../../model/SysUser';
import { SysUserPost } from '../../model/SysUserPost';
import { SysUserRole } from '../../model/SysUserRole';
import { SysUserPostRepositoryImpl } from '../../repository/impl/SysUserPostRepositoryImpl';
import { SysUserRepositoryImpl } from '../../repository/impl/SysUserRepositoryImpl';
import { SysUserRoleRepositoryImpl } from '../../repository/impl/SysUserRoleRepositoryImpl';
import { ISysUserService } from '../ISysUserService';
import { SysConfigServiceImpl } from './SysConfigServiceImpl';
import { SysDictDataServiceImpl } from './SysDictDataServiceImpl';

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

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysDictDataService: SysDictDataServiceImpl;

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

  async importUser(
    sheetItemArr: Record<string, string>[],
    isUpdateSupport: boolean,
    operName: string
  ): Promise<string> {
    // 读取默认初始密码
    const initPassword = await this.sysConfigService.selectConfigValueByKey(
      'sys.user.initPassword'
    );
    // 读取用户性别字典数据
    const sysUserSexSDDList =
      await this.sysDictDataService.selectDictDataByType('sys_user_sex');
    // 导入记录
    let successNum = 0;
    let failureNum = 0;
    const successMsgArr: string[] = [];
    const failureMsgArr: string[] = [];
    const mustItemArr = ['登录名称', '用户名称'];
    for (const item of sheetItemArr) {
      // 检查必填列
      const ownItem = mustItemArr.every(m => Object.keys(item).includes(m));
      if (!ownItem) {
        failureNum++;
        failureMsgArr.push(`表格中必填列表项，${mustItemArr.join('、')}`);
        continue;
      }

      // 构建用户实体信息
      const newSysUser = new SysUser();
      newSysUser.userType = 'sys';
      newSysUser.password = initPassword;
      newSysUser.deptId = item['部门编号'];
      newSysUser.userName = item['登录名称'];
      newSysUser.nickName = item['用户名称'];
      newSysUser.phonenumber = item['手机号码'];
      newSysUser.email = item['用户邮箱'];
      newSysUser.status = item['帐号状态'] === '启用' ? STATUS_YES : STATUS_NO;

      // 用户性别转值
      const sysUserSex = sysUserSexSDDList.find(
        sdd => sdd.dictLabel === item['用户性别']
      );
      if (sysUserSex && sysUserSex.dictValue) {
        newSysUser.sex = sysUserSex.dictValue;
      } else {
        newSysUser.sex = '0';
      }

      // 检查手机号码格式并判断是否唯一
      if (newSysUser.phonenumber) {
        if (validMobile(newSysUser.phonenumber)) {
          const uniquePhone = await this.checkUniquePhone(
            newSysUser.phonenumber
          );
          if (!uniquePhone) {
            const msg = `用户编号：${item['用户编号']} 手机号码 ${newSysUser.phonenumber} 已存在`;
            failureNum++;
            failureMsgArr.push(msg);
            continue;
          }
        } else {
          const msg = `用户编号：${item['用户编号']} 手机号码 ${newSysUser.phonenumber} 格式错误`;
          failureNum++;
          failureMsgArr.push(msg);
          continue;
        }
      }

      // 检查邮箱格式并判断是否唯一
      if (newSysUser.email) {
        if (validEmail(newSysUser.email)) {
          const uniqueEmail = await this.checkUniqueEmail(newSysUser.email);
          if (!uniqueEmail) {
            const msg = `用户编号：${item['用户编号']} 用户邮箱 ${newSysUser.email} 已存在`;
            failureNum++;
            failureMsgArr.push(msg);
            continue;
          }
        } else {
          const msg = `用户编号：${item['用户编号']} 用户邮箱 ${newSysUser.email} 格式错误`;
          failureNum++;
          failureMsgArr.push(msg);
          continue;
        }
      }

      // 验证是否存在这个用户
      const user = await this.sysUserRepository.selectUserByUserName(
        newSysUser.userName
      );
      if (!user) {
        newSysUser.createBy = operName;
        const insertId = await this.insertUser(newSysUser);
        if (insertId) {
          const msg = `用户编号：${item['用户编号']} 登录名称 ${item['登录名称']} 导入成功`;
          successNum++;
          successMsgArr.push(msg);
        } else {
          const msg = `用户编号：${item['用户编号']} 登录名称 ${item['登录名称']} 导入失败`;
          failureNum++;
          failureMsgArr.push(msg);
        }
        continue;
      }

      // 如果用户已存在 同时 是否更新支持
      if (user && isUpdateSupport) {
        newSysUser.userId = user.userId;
        newSysUser.updateBy = operName;
        const rows = await this.updateUser(newSysUser);
        if (rows > 0) {
          const msg = `用户编号：${item['用户编号']} 登录名称 ${item['登录名称']} 更新成功`;
          successNum++;
          successMsgArr.push(msg);
        } else {
          const msg = `用户编号：${item['用户编号']} 登录名称 ${item['登录名称']} 更新失败`;
          failureNum++;
          failureMsgArr.push(msg);
        }
        continue;
      }
    }

    if (failureNum > 0) {
      failureMsgArr.unshift(
        `很抱歉，导入失败！共 ${failureNum} 条数据格式不正确，错误如下：`
      );
      throw new Error(failureMsgArr.join('<br/>'));
    }
    successMsgArr.unshift(
      `恭喜您，数据已全部导入成功！共 ${successNum} 条，数据如下：`
    );
    return successMsgArr.join('<br/>');
  }
}
