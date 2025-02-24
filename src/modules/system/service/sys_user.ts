import { Provide, Inject, Singleton } from '@midwayjs/core';

import {
  validEmail,
  validMobile,
} from '../../../framework/utils/regular/regular';
import { SYS_ROLE_SYSTEM_ID } from '../../../framework/constants/system';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { FileUtil } from '../../../framework/utils/file/file';
import { parseDateToStr } from '../../../framework/utils/date/data';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysUserRoleRepository } from '../repository/sys_user_role';
import { SysUserPostRepository } from '../repository/sys_user_post';
import { SysUserRepository } from '../repository/sys_user';
import { SysDeptRepository } from '../repository/sys_dept';
import { SysRoleRepository } from '../repository/sys_role';
import { SysDictTypeService } from './sys_dict_type';
import { SysConfigService } from './sys_config';
import { SysUserRole } from '../model/sys_user_role';
import { SysUserPost } from '../model/sys_user_post';
import { SysRole } from '../model/sys_role';
import { SysUser } from '../model/sys_user';

/**用户 服务层处理 */
@Provide()
@Singleton()
export class SysUserService {
  /**用户服务 */
  @Inject()
  private sysUserRepository: SysUserRepository;

  /**角色服务 */
  @Inject()
  private sysRoleRepository: SysRoleRepository;

  /**部门服务 */
  @Inject()
  private sysDeptRepository: SysDeptRepository;

  /**用户与角色服务 */
  @Inject()
  private sysUserRoleRepository: SysUserRoleRepository;

  /**用户与岗位服务 */
  @Inject()
  private sysUserPostRepository: SysUserPostRepository;

  /**字典类型服务 */
  @Inject()
  private sysDictTypeService: SysDictTypeService;

  /**参数配置服务 */
  @Inject()
  private sysConfigService: SysConfigService;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns []
   */
  public async findByPage(
    query: Record<string, string>,
    dataScopeSQL: string
  ): Promise<[SysUser[], number]> {
    const [rows, total] = await this.sysUserRepository.selectByPage(
      query,
      dataScopeSQL
    );
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i];
      delete rows[i].password;
      delete rows[i].delFlag;
      delete rows[i].postIds;
      // 部门
      const deptInfo = await this.sysDeptRepository.selectById(v.deptId);
      rows[i].dept = deptInfo;
      // 角色
      const roleArr = await this.sysRoleRepository.selectByUserId(v.userId);
      const roleIds: number[] = [];
      const roles: SysRole[] = [];
      for (const role of roleArr) {
        roles.push(role);
        roleIds.push(role.roleId);
      }
      rows[i].roles = roles;
      rows[i].roleIds = roleIds;
    }
    return [rows, total];
  }

  /**
   * 查询数据
   * @param sysUser 信息
   * @returns []
   */
  public async find(sysUser: SysUser): Promise<SysUser[]> {
    return await this.sysUserRepository.select(sysUser);
  }

  /**
   * 根据ID查询信息
   * @param userId ID
   * @returns 结果
   */
  public async findById(userId: number): Promise<SysUser> {
    let userInfo = new SysUser();
    if (userId <= 0) {
      return userInfo;
    }
    const users = await this.sysUserRepository.selectByIds([userId]);
    if (users.length > 0) {
      userInfo = users[0];
      // 部门
      const deptInfo = await this.sysDeptRepository.selectById(userInfo.deptId);
      userInfo.dept = deptInfo;
      // 角色
      const roleArr = await this.sysRoleRepository.selectByUserId(
        userInfo.userId
      );
      const roleIds: number[] = [];
      const roles: SysRole[] = [];
      for (const role of roleArr) {
        roles.push(role);
        roleIds.push(role.roleId);
      }
      userInfo.roles = roles;
      userInfo.roleIds = roleIds;
    }
    return userInfo;
  }

  /**
   * 新增信息
   * @param sysUser 信息
   * @returns ID
   */
  public async insert(sysUser: SysUser): Promise<number> {
    // 新增用户信息
    const insertId = await this.sysUserRepository.insert(sysUser);
    if (insertId > 0) {
      await this.insertUserRole(insertId, sysUser.roleIds); // 新增用户角色信息
      await this.insertUserPost(insertId, sysUser.postIds); // 新增用户岗位信息
    }
    return insertId;
  }

  /**
   * 新增用户角色信息
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   * @returns 影响记录数
   */
  private async insertUserRole(
    userId: number,
    roleIds: number[]
  ): Promise<number> {
    if (userId <= 0 || roleIds.length <= 0) {
      return 0;
    }

    const arr: SysUserRole[] = [];
    for (const roleId of roleIds) {
      // 系统管理员角色禁止操作，只能通过配置指定用户ID分配
      if (roleId <= 0 || roleId === SYS_ROLE_SYSTEM_ID) {
        continue;
      }
      const sysUserRole = new SysUserRole();
      sysUserRole.userId = userId;
      sysUserRole.roleId = roleId;
      arr.push(sysUserRole);
    }

    return await this.sysUserRoleRepository.batchInsert(arr);
  }

  /**
   * 新增用户岗位信息
   * @param userId 用户ID
   * @param postIds 岗位ID数组
   * @returns 影响记录数
   */
  private async insertUserPost(
    userId: number,
    postIds: number[]
  ): Promise<number> {
    if (userId <= 0 || postIds.length <= 0) {
      return 0;
    }

    const arr: SysUserPost[] = [];
    for (const postId of postIds) {
      if (postId <= 0) {
        continue;
      }
      const sysUserPost = new SysUserPost();
      sysUserPost.userId = userId;
      sysUserPost.postId = postId;
      arr.push(sysUserPost);
    }

    return await this.sysUserPostRepository.batchInsert(arr);
  }

  /**
   * 修改信息
   * @param sysUser 信息
   * @returns 影响记录数
   */
  public async update(sysUser: SysUser): Promise<number> {
    return await this.sysUserRepository.update(sysUser);
  }

  /**
   * 修改用户信息同时更新角色和岗位
   * @param sysUser 信息
   * @returns 影响记录数
   */
  public async updateUserAndRolePost(sysUser: SysUser): Promise<number> {
    // 删除用户与角色关联
    await this.sysUserRoleRepository.deleteByUserIds([sysUser.userId]);
    // 新增用户角色信息
    await this.insertUserRole(sysUser.userId, sysUser.roleIds);
    // 删除用户与岗位关联
    await this.sysUserPostRepository.deleteByUserIds([sysUser.userId]);
    // 新增用户岗位信息
    await this.insertUserPost(sysUser.userId, sysUser.postIds);
    return await this.sysUserRepository.update(sysUser);
  }

  /**
   * 批量删除信息
   * @param userIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(userIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const users = await this.sysUserRepository.selectByIds(userIds);
    if (users.length <= 0) {
      return [0, '没有权限访问用户数据！'];
    }
    if (users.length === userIds.length) {
      await this.sysUserRoleRepository.deleteByUserIds(userIds); // 删除用户与角色关联
      await this.sysUserPostRepository.deleteByUserIds(userIds); // 删除用户与岗位关联
      const rows = await this.sysUserRepository.deleteByIds(userIds);
      return [rows, ''];
    }
    return [0, '删除用户信息失败！'];
  }

  /**
   * 检查用户名称是否唯一
   * @param userName 用户名
   * @param userId 用户ID
   * @returns 结果
   */
  public async checkUniqueByUserName(
    userName: string,
    userId: number
  ): Promise<boolean> {
    const sysUser = new SysUser();
    sysUser.userName = userName;
    const uniqueId = await this.sysUserRepository.checkUnique(sysUser);
    if (uniqueId === userId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查手机号码是否唯一
   * @param phone 手机号码
   * @param userId 用户ID
   * @returns 结果
   */
  public async checkUniqueByPhone(
    phone: string,
    userId: number
  ): Promise<boolean> {
    const sysUser = new SysUser();
    sysUser.phone = phone;
    const uniqueId = await this.sysUserRepository.checkUnique(sysUser);
    if (uniqueId === userId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查Email是否唯一
   * @param email 手机号码
   * @param userId 用户ID
   * @returns 结果
   */
  public async checkUniqueByEmail(
    email: string,
    userId: number
  ): Promise<boolean> {
    const sysUser = new SysUser();
    sysUser.email = email;
    const uniqueId = await this.sysUserRepository.checkUnique(sysUser);
    if (uniqueId === userId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 通过用户名查询用户信息
   * @param userName 用户名
   * @returns 结果
   */
  public async findByUserName(userName: string): Promise<SysUser> {
    const userInfo = await this.sysUserRepository.selectByUserName(userName);
    if (userInfo.userName !== userName) {
      return userInfo;
    }
    // 部门
    const deptInfo = await this.sysDeptRepository.selectById(userInfo.deptId);
    userInfo.dept = deptInfo;
    // 角色
    const roleArr = await this.sysRoleRepository.selectByUserId(
      userInfo.userId
    );
    const roles: SysRole[] = [];
    const roleIds: number[] = [];
    for (const role of roleArr) {
      roles.push(role);
      roleIds.push(role.roleId);
    }
    userInfo.roles = roles;
    userInfo.roleIds = roleIds;
    return userInfo;
  }

  /**
   * 根据条件分页查询分配用户角色列表
   * @param query 查询信息 { roleId:角色ID,auth:是否已分配 }
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns 结果
   */
  public async findAuthUsersPage(
    query: Record<string, string>,
    dataScopeSQL: string
  ): Promise<[SysUser[], number]> {
    const [rows, total] = await this.sysUserRepository.selectAuthUsersByPage(
      query,
      dataScopeSQL
    );
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i];
      delete rows[i].password;
      delete rows[i].delFlag;
      delete rows[i].postIds;
      // 部门
      const deptInfo = await this.sysDeptRepository.selectById(v.deptId);
      rows[i].dept = deptInfo;
      // 角色
      const roleArr = await this.sysRoleRepository.selectByUserId(v.userId);
      const roleIds: number[] = [];
      const roles: SysRole[] = [];
      for (const role of roleArr) {
        roles.push(role);
        roleIds.push(role.roleId);
      }
      rows[i].roles = roles;
      rows[i].roleIds = roleIds;
    }
    return [rows, total];
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysUser[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    // 读取用户性别字典数据
    const dictSysUserSex = await this.sysDictTypeService.findDataByType(
      'sys_user_sex'
    );
    for (const row of rows) {
      // 用户性别
      let sysUserSex = '';
      for (const v of dictSysUserSex) {
        if (row.sex === v.dataValue) {
          sysUserSex = v.dataLabel;
          break;
        }
      }
      // 账号状态
      let statusValue = '停用';
      if (row.statusFlag === STATUS_YES) {
        statusValue = '正常';
      }
      const data = {
        用户编号: row.userId,
        登录账号: row.userName,
        用户昵称: row.nickName,
        用户邮箱: row.email,
        手机号码: row.phone,
        用户性别: sysUserSex,
        帐号状态: statusValue,
        部门编号: row.deptId,
        部门名称: row.dept?.deptName,
        部门负责人: row.dept?.leader,
        最后登录IP: row.loginIp,
        最后登录时间: parseDateToStr(row.loginTime),
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }

  /**
   * 导入数据表格
   * @param rows 表格行数组
   * @param operaName 操作员
   * @param updateSupport 支持更新
   * @returns 结果信息
   */
  public async importData(
    rows: Record<string, string>[],
    operaName: string,
    updateSupport: boolean
  ) {
    // 读取默认初始密码
    const initPassword = await this.sysConfigService.findValueByKey(
      'sys.user.initPassword'
    );
    // 读取用户性别字典数据
    const dictSysUserSex = await this.sysDictTypeService.findDataByType(
      'sys_user_sex'
    );

    // 导入记录
    let successNum = 0;
    let failureNum = 0;
    const successMsgArr: string[] = [];
    const failureMsgArr: string[] = [];
    const mustItemArr = ['登录账号', '用户昵称'];
    for (const item of rows) {
      // 检查必填列
      const ownItem = mustItemArr.every(m => Object.keys(item).includes(m));
      if (!ownItem) {
        failureNum++;
        failureMsgArr.push(`表格中必填列表项，${mustItemArr.join('、')}`);
        continue;
      }

      // 用户性别转值
      let sysUserSex = '0';
      for (const v of dictSysUserSex) {
        if (v.dataLabel === item['用户性别']) {
          sysUserSex = v.dataValue;
          break;
        }
      }
      let sysUserStatus = STATUS_NO;
      if (item['帐号状态'] === '正常') {
        sysUserStatus = STATUS_YES;
      }
      let sysUserDeptId = 100;
      if (item['部门编号']) {
        sysUserDeptId = parseNumber(item['部门编号']);
      }

      // 验证是否存在这个用户
      const newSysUser = await this.findByUserName(item['登录账号']);
      newSysUser.password = initPassword;
      newSysUser.userName = item['登录账号'];
      newSysUser.nickName = item['用户昵称'];
      newSysUser.phone = item['手机号码'];
      newSysUser.email = item['用户邮箱'];
      newSysUser.statusFlag = sysUserStatus;
      newSysUser.sex = sysUserSex;
      newSysUser.deptId = sysUserDeptId;
      newSysUser.roleIds = [];
      newSysUser.postIds = [];

      // 行用户编号
      const rowNo = item['用户编号'];

      // 检查手机号码格式并判断是否唯一
      if (newSysUser.phone) {
        if (validMobile(newSysUser.phone)) {
          const uniquePhone = await this.checkUniqueByPhone(
            newSysUser.phone,
            newSysUser.userId
          );
          if (!uniquePhone) {
            const msg = `用户编号：${rowNo} 手机号码：${newSysUser.phone} 已存在`;
            failureNum++;
            failureMsgArr.push(msg);
            continue;
          }
        } else {
          const msg = `用户编号：${rowNo} 手机号码：${newSysUser.phone} 格式错误`;
          failureNum++;
          failureMsgArr.push(msg);
          continue;
        }
      }

      // 检查邮箱格式并判断是否唯一
      if (newSysUser.email) {
        if (validEmail(newSysUser.email)) {
          const uniqueEmail = await this.checkUniqueByEmail(
            newSysUser.email,
            newSysUser.userId
          );
          if (!uniqueEmail) {
            const msg = `用户编号：${rowNo} 用户邮箱：${newSysUser.email} 已存在`;
            failureNum++;
            failureMsgArr.push(msg);
            continue;
          }
        } else {
          const msg = `用户编号：${rowNo} 用户邮箱：${newSysUser.email} 格式错误`;
          failureNum++;
          failureMsgArr.push(msg);
          continue;
        }
      }

      if (!newSysUser.userId) {
        newSysUser.createBy = operaName;
        const insertId = await this.insert(newSysUser);
        if (insertId > 0) {
          const msg = `用户编号：${rowNo} 登录账号：${newSysUser.userName} 导入成功`;
          successNum++;
          successMsgArr.push(msg);
        } else {
          const msg = `用户编号：${rowNo} 登录账号：${newSysUser.userName} 导入失败`;
          failureNum++;
          failureMsgArr.push(msg);
        }
        continue;
      }

      // 如果用户已存在 同时 是否更新支持
      if (newSysUser.userId > 0 && updateSupport) {
        newSysUser.password = ''; // 密码不更新
        newSysUser.updateBy = operaName;
        const rows = await this.update(newSysUser);
        if (rows > 0) {
          const msg = `用户编号：${rowNo} 登录账号：${newSysUser.userName} 更新成功`;
          successNum++;
          successMsgArr.push(msg);
        } else {
          const msg = `用户编号：${rowNo} 登录账号：${newSysUser.userName} 更新失败`;
          failureNum++;
          failureMsgArr.push(msg);
        }
        continue;
      }
    }

    let message = '';
    if (failureNum > 0) {
      const msg = `很抱歉，导入失败！共 ${failureNum} 条数据格式不正确，错误如下：`;
      failureMsgArr.unshift(msg);
      message = failureMsgArr.join('<br/>');
    } else {
      const msg = `恭喜您，数据已全部导入成功！共 ${successNum} 条，数据如下：`;
      successMsgArr.unshift(msg);
      message = successMsgArr.join('<br/>');
    }
    return message;
  }
}
