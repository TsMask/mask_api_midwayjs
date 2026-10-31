import { Provide, Inject, Singleton } from '@midwayjs/core';
import { EntityManager } from 'typeorm';

import {
  validEmail,
  validMobile,
} from '../../../internal/shared/regular/regular';
import { SYS_ROLE_SYSTEM_ID } from '../../../internal/shared/constants/system';
import { STATUS_NO, STATUS_YES } from '../../../internal/shared/constants/common';
import { FileUtil } from '../../../internal/shared/file/file';
import { parseDateToRFC3339 } from '../../../internal/shared/date/data';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { UserTokenService } from '../../../internal/web/token/user_token';
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
import { SysDept } from '../model/sys_dept';

/**用户 服务层处理 */
@Provide()
@Singleton()
export class SysUserService {
  /**动态数据源 */
  @Inject()
  private db: DynamicDataSource;

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

  @Inject()
  private token: UserTokenService;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @param filter 角色数据范围过滤对象
   * @returns []
   */
  public async findByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysUser[], number]> {
    const [rows, total] = await this.sysUserRepository.selectByPage(
      query,
      filter
    );
    if (total === 0) {
      return [[], 0];
    }
    const deptIds = rows.map(u => u.deptId).filter(id => id > 0);
    const deptMap = new Map<number, SysDept>();
    if (deptIds.length > 0) {
      const depts = await this.sysDeptRepository.selectByIds(deptIds);
      for (const dept of depts) {
        deptMap.set(dept.id, dept);
      }
    }
    const userIds = rows.map(u => u.id);
    let roleMap = new Map<number, SysRole[]>();
    if (userIds.length > 0) {
      roleMap = await this.sysRoleRepository.selectByUserIds(userIds);
    }
    for (const v of rows) {
      delete (v as Partial<SysUser>).userPassword;
      delete (v as Partial<SysUser>).userDel;
      delete (v as Partial<SysUser>).postIds;
      v.dept = deptMap.get(v.deptId)!;
      v.roles = roleMap.get(v.id) || [];
      v.roleIds = v.roles.map(r => r.id);
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
    if (userId <= 0) {
      return new SysUser();
    }
    const users = await this.sysUserRepository.selectByIds([userId]);
    if (users.length === 0) {
      return new SysUser();
    }
    const userInfo = users[0];
    // 批量查询部门和角色
    const deptMap = new Map<number, SysDept>();
    if (userInfo.deptId > 0) {
      const depts = await this.sysDeptRepository.selectByIds([userInfo.deptId]);
      for (const dept of depts) {
        deptMap.set(dept.id, dept);
      }
    }
    const roleMap = await this.sysRoleRepository.selectByUserIds([userInfo.id]);
    userInfo.dept = deptMap.get(userInfo.deptId)!;
    userInfo.roles = roleMap.get(userInfo.id) || [];
    userInfo.roleIds = userInfo.roles.map(r => r.id);
    return userInfo;
  }

  /**
   * 新增信息
   * @param sysUser 信息
   * @returns ID
   */
  public async insert(sysUser: SysUser): Promise<number> {
    return await this.db.transaction('', async manager => {
      const insertId = await this.sysUserRepository.insert(sysUser, manager);
      if (insertId > 0) {
        await this.insertUserRole(insertId, sysUser.roleIds, manager);
        await this.insertUserPost(insertId, sysUser.postIds, manager);
      }
      return insertId;
    });
  }

  /**
   * 新增用户角色关联
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   * @param entityManager 事务EntityManager（可选）
   */
  private async insertUserRole(
    userId: number,
    roleIds: number[],
    entityManager?: EntityManager
  ): Promise<void> {
    if (userId <= 0 || !roleIds?.length) return;
    const arr: SysUserRole[] = [];
    for (const roleId of roleIds) {
      if (roleId <= 0 || roleId === SYS_ROLE_SYSTEM_ID) continue;
      const ur = new SysUserRole();
      ur.userId = userId;
      ur.roleId = roleId;
      arr.push(ur);
    }
    if (arr.length > 0) {
      await this.sysUserRoleRepository.batchInsert(arr, entityManager);
    }
  }

  /**
   * 新增用户岗位关联
   * @param userId 用户ID
   * @param postIds 岗位ID数组
   * @param entityManager 事务EntityManager（可选）
   */
  private async insertUserPost(
    userId: number,
    postIds: number[],
    entityManager?: EntityManager
  ): Promise<void> {
    if (userId <= 0 || !postIds?.length) return;
    const arr: SysUserPost[] = [];
    for (const postId of postIds) {
      if (postId <= 0) continue;
      const up = new SysUserPost();
      up.userId = userId;
      up.postId = postId;
      arr.push(up);
    }
    if (arr.length > 0) {
      await this.sysUserPostRepository.batchInsert(arr, entityManager);
    }
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
    const rows = await this.db.transaction('', async manager => {
      await this.sysUserRoleRepository.deleteByUserIds([sysUser.id], manager);
      await this.insertUserRole(sysUser.id, sysUser.roleIds, manager);
      await this.sysUserPostRepository.deleteByUserIds([sysUser.id], manager);
      await this.insertUserPost(sysUser.id, sysUser.postIds, manager);
      return await this.sysUserRepository.update(sysUser, manager);
    });
    if (rows > 0) {
      await this.token?.removeByUserIds([sysUser.id]);
    }
    return rows;
  }

  /**
   * 批量删除信息
   * @param userIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(userIds: number[]): Promise<[number, string]> {
    const users = await this.sysUserRepository.selectByIds(userIds);
    if (users.length <= 0) {
      return [0, '没有权限访问用户数据！'];
    }
    if (users.length === userIds.length) {
      const rows = await this.db.transaction('', async manager => {
        await this.sysUserRoleRepository.deleteByUserIds(userIds, manager);
        await this.sysUserPostRepository.deleteByUserIds(userIds, manager);
        return await this.sysUserRepository.deleteByIds(userIds, manager);
      });
      if (rows > 0) {
        await this.token?.removeByUserIds(userIds);
      }
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
    sysUser.userPhone = phone;
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
    sysUser.userEmail = email;
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
    // 批量查询部门和角色
    const deptMap = new Map<number, SysDept>();
    if (userInfo.deptId > 0) {
      const depts = await this.sysDeptRepository.selectByIds([userInfo.deptId]);
      for (const dept of depts) {
        deptMap.set(dept.id, dept);
      }
    }
    const roleMap = await this.sysRoleRepository.selectByUserIds([userInfo.id]);
    userInfo.dept = deptMap.get(userInfo.deptId)!;
    userInfo.roles = roleMap.get(userInfo.id) || [];
    userInfo.roleIds = userInfo.roles.map(r => r.id);
    return userInfo;
  }

  /**
   * 根据手机号码查询用户信息
   * @param phone 手机号码
   * @returns 用户信息
   */
  public async findByPhone(phone: string): Promise<SysUser> {
    const userInfo = await this.sysUserRepository.selectByPhone(phone);
    if (userInfo.userPhone !== phone) {
      return userInfo;
    }

    const deptMap = new Map<number, SysDept>();
    if (userInfo.deptId > 0) {
      const depts = await this.sysDeptRepository.selectByIds([userInfo.deptId]);
      for (const dept of depts) {
        deptMap.set(dept.id, dept);
      }
    }
    const roleMap = await this.sysRoleRepository.selectByUserIds([userInfo.id]);
    userInfo.dept = deptMap.get(userInfo.deptId)!;
    userInfo.roles = roleMap.get(userInfo.id) || [];
    userInfo.roleIds = userInfo.roles.map(r => r.id);
    return userInfo;
  }

  /**
   * 根据条件分页查询分配用户角色列表
   * @param query 查询信息 { roleId:角色ID,auth:是否已分配 }
   * @param filter 角色数据范围过滤对象
   * @returns 结果
   */
  public async findAuthUsersPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysUser[], number]> {
    const [rows, total] = await this.sysUserRepository.selectAuthUsersByPage(
      query,
      filter
    );
    if (total === 0) {
      return [[], 0];
    }
    const deptIds = rows.map(u => u.deptId).filter(id => id > 0);
    const deptMap = new Map<number, SysDept>();
    if (deptIds.length > 0) {
      const depts = await this.sysDeptRepository.selectByIds(deptIds);
      for (const dept of depts) {
        deptMap.set(dept.id, dept);
      }
    }
    const userIds = rows.map(u => u.id);
    let roleMap = new Map<number, SysRole[]>();
    if (userIds.length > 0) {
      roleMap = await this.sysRoleRepository.selectByUserIds(userIds);
    }
    for (const v of rows) {
      delete (v as Partial<SysUser>).userPassword;
      delete (v as Partial<SysUser>).userDel;
      delete (v as Partial<SysUser>).postIds;
      v.dept = deptMap.get(v.deptId)!;
      v.roles = roleMap.get(v.id) || [];
      v.roleIds = v.roles.map(r => r.id);
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
    // 第一行表头标题
    const data: string[][] = [
      [
        '用户编号',
        '登录账号',
        '用户昵称',
        '用户邮箱',
        '手机号码',
        '用户性别',
        '帐号状态',
        '部门编号',
        '部门名称',
        '部门负责人',
        '最后登录IP',
        '最后登录时间',
      ],
    ];
    // 读取用户性别字典数据
    const dictSysUserGender =
      await this.sysDictTypeService.findDataByType('sys_user_gender');
    for (const row of rows) {
      // 用户性别
      let sysUserGender = '未知';
      for (const v of dictSysUserGender) {
        if (row.userGender === v.dataValue) {
          sysUserGender = v.dataLabel;
          break;
        }
      }
      // 账号状态
      let statusValue = '停用';
      if (row.userStatus === STATUS_YES) {
        statusValue = '正常';
      }
      data.push([
        `${row.id ?? 0}`,
        row.userName ?? '',
        row.userNick ?? '',
        row.userEmail ?? '',
        row.userPhone ?? '',
        sysUserGender,
        statusValue,
        `${row.dept?.id ?? 0}`,
        row.dept?.deptName ?? '',
        row.dept?.deptLeader ?? '',
        row.userLoginIp ?? '',
        parseDateToRFC3339(row.userLoginTime ?? 0),
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
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
      'sys.user.init_password',
      'sys.user.initPassword'
    );
    // 读取用户性别字典数据
    const dictSysUserGender =
      await this.sysDictTypeService.findDataByType('sys_user_gender');
    const genderLabelToValueMap = new Map(
      dictSysUserGender.map(v => [v.dataLabel, v.dataValue])
    );

    // 导入记录
    let successNum = 0;
    let failureNum = 0;
    const successMsgArr: string[] = [];
    const failureMsgArr: string[] = [];
    const mustItemArr = ['username', 'nickname'];
    for (const item of rows) {
      // 检查必填列
      const ownItem = mustItemArr.every(
        m => item[m] !== undefined && item[m] !== ''
      );
      if (!ownItem) {
        failureNum++;
        failureMsgArr.push(`表格中必填列表项，${mustItemArr.join('、')}`);
        continue;
      }

      // 用户性别转值
      const sysUserGender = genderLabelToValueMap.get(item.gender) ?? '0';
      let sysUserStatus = STATUS_NO;
      if (item.status === '正常') {
        sysUserStatus = STATUS_YES;
      }
      let sysUserDeptId = 100;
      if (item.dept_id) {
        sysUserDeptId = parseNumber(item.dept_id);
      }

      // 验证是否存在这个用户
      const newSysUser = await this.findByUserName(item.username);
      newSysUser.userPassword = initPassword;
      newSysUser.userName = item.username;
      newSysUser.userNick = item.nickname;
      newSysUser.userPhone = item.phone ?? '';
      newSysUser.userEmail = item.email ?? '';
      newSysUser.userStatus = sysUserStatus;
      newSysUser.userGender = sysUserGender;
      newSysUser.deptId = sysUserDeptId;
      newSysUser.roleIds = [];
      newSysUser.postIds = [];

      // 行用户编号
      const rowNo = item.user_id ?? '';

      // 检查手机号码格式并判断是否唯一
      if (newSysUser.userPhone) {
        if (validMobile(newSysUser.userPhone)) {
          const uniquePhone = await this.checkUniqueByPhone(
            newSysUser.userPhone,
            newSysUser.id
          );
          if (!uniquePhone) {
            const msg = `用户编号：${rowNo} 手机号码：${newSysUser.userPhone} 已存在`;
            failureNum++;
            failureMsgArr.push(msg);
            continue;
          }
        } else {
          const msg = `用户编号：${rowNo} 手机号码：${newSysUser.userPhone} 格式错误`;
          failureNum++;
          failureMsgArr.push(msg);
          continue;
        }
      }

      // 检查邮箱格式并判断是否唯一
      if (newSysUser.userEmail) {
        if (validEmail(newSysUser.userEmail)) {
          const uniqueEmail = await this.checkUniqueByEmail(
            newSysUser.userEmail,
            newSysUser.id
          );
          if (!uniqueEmail) {
            const msg = `用户编号：${rowNo} 用户邮箱：${newSysUser.userEmail} 已存在`;
            failureNum++;
            failureMsgArr.push(msg);
            continue;
          }
        } else {
          const msg = `用户编号：${rowNo} 用户邮箱：${newSysUser.userEmail} 格式错误`;
          failureNum++;
          failureMsgArr.push(msg);
          continue;
        }
      }

      if (!newSysUser.id) {
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
      if (newSysUser.id > 0 && updateSupport) {
        newSysUser.userPassword = ''; // 密码不更新
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

    let message: string;
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
