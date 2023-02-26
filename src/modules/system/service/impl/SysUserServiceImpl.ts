import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../../framework/constants/CommonConstants';
import {
  validEmail,
  validMobile,
} from '../../../../framework/utils/RegularUtils';
import { SysDictData } from '../../model/SysDictData';
import { SysUser } from '../../model/SysUser';
import { SysUserPost } from '../../model/SysUserPost';
import { SysUserRole } from '../../model/SysUserRole';
import { SysPostRepositoryImpl } from '../../repository/impl/SysPostRepositoryImpl';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
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
    roleId: string,
    allocated: boolean,
    query: ListQueryPageOptions,
    dataScopeSQL = ''
  ): Promise<RowPagesType> {
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
    roleIds: string[] = []
  ): Promise<number> {
    if (roleIds && roleIds.length <= 0) return 0;
    const sysUserRoles: SysUserRole[] = [];
    for (const roleId of roleIds) {
      if (!roleId) continue;
      const ur = new SysUserRole();
      ur.userId = userId;
      ur.roleId = roleId;
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
    postIds: string[] = []
  ): Promise<number> {
    if (postIds && postIds.length <= 0) return 0;
    const sysUserPosts: SysUserPost[] = [];
    for (const postId of postIds) {
      if (!postId) continue;
      const up = new SysUserPost();
      up.userId = userId;
      up.postId = postId;
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
    const sysUserSexSDD = new SysDictData();
    sysUserSexSDD.dictType = 'sys_user_sex';
    const sysUserSexSDDList = await this.sysDictDataService.selectDictDataList(
      sysUserSexSDD
    );
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
      newSysUser.password = initPassword;
      newSysUser.deptId = item['部门编号'];
      newSysUser.userName = item['登录名称'];
      newSysUser.nickName = item['用户名称'];
      newSysUser.phonenumber = item['手机号码'];
      newSysUser.email = item['用户邮箱'];
      newSysUser.status = item['帐号状态'] === '启用' ? STATUS_YES : STATUS_NO;
      const sysUserSex = sysUserSexSDDList.find(
        sdd => sdd.dictLabel === item['用户性别']
      );
      if (sysUserSex && sysUserSex.dictValue) {
        newSysUser.sex = sysUserSex.dictValue; // 用户性别转值
      } else {
        newSysUser.sex = '0';
      }

      // 判断属性值是否唯一
      const uniqueUserName = await this.checkUniqueUserName(newSysUser);
      if (!uniqueUserName) {
        failureNum++;
        failureMsgArr.push(
          `序号：${item['序号']} 登录名称 ${newSysUser.userName} 已存在`
        );
        continue;
      }
      if (newSysUser.phonenumber) {
        if (validMobile(newSysUser.phonenumber)) {
          const uniquePhone = await this.checkUniquePhone(newSysUser);
          if (!uniquePhone) {
            failureNum++;
            failureMsgArr.push(
              `序号：${item['序号']} 手机号码 ${newSysUser.phonenumber} 已存在`
            );
            continue;
          }
        } else {
          failureNum++;
          failureMsgArr.push(
            `序号：${item['序号']} 手机号码 ${newSysUser.phonenumber} 格式错误`
          );
          continue;
        }
      }
      if (newSysUser.email) {
        if (validEmail(newSysUser.email)) {
          const uniqueEmail = await this.checkUniqueEmail(newSysUser);
          if (!uniqueEmail) {
            failureNum++;
            failureMsgArr.push(
              `序号：${item['序号']} 用户邮箱 ${newSysUser.email} 已存在`
            );
            continue;
          }
        } else {
          failureNum++;
          failureMsgArr.push(
            `序号：${item['序号']} 用户邮箱 ${newSysUser.email} 格式错误`
          );
          continue;
        }
      }
      // 验证是否存在这个用户
      const user = await this.sysUserRepository.selectUserByUserName(
        newSysUser.userName
      );
      if (!user) {
        newSysUser.createBy = operName;
        await this.insertUser(newSysUser);
        successNum++;
        successMsgArr.push(
          `序号：${item['序号']} 登录名称 ${newSysUser.userName} 导入成功`
        );
        continue;
      }
      // 如果用户已存在 同时 是否更新支持
      if (user && isUpdateSupport) {
        newSysUser.updateBy = operName;
        await this.updateUser(newSysUser);
        successNum++;
        successMsgArr.push(
          `序号：${item['序号']} 登录名称 ${item['登录名称']} 更新成功`
        );
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
