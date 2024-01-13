import {
  Body,
  Controller,
  Del,
  Fields,
  Files,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@midwayjs/core';
import { UploadFileInfo } from '@midwayjs/upload';
import { Result } from '../../../framework/vo/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
import { OperateLog } from '../../../framework/decorator/OperateLogMethodDecorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { FileService } from '../../../framework/service/FileService';
import { parseDateToStr } from '../../../framework/utils/DateUtils';
import { RepeatSubmit } from '../../../framework/decorator/RepeatSubmitMethodDecorator';
import { ADMIN_ROLE_ID } from '../../../framework/constants/AdminConstants';
import { validPassword } from '../../../framework/utils/RegularUtils';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../framework/constants/CommonConstants';
import {
  validEmail,
  validMobile,
  validUsername,
} from '../../../framework/utils/RegularUtils';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { SysConfigServiceImpl } from '../service/impl/SysConfigServiceImpl';
import { SysDictDataServiceImpl } from '../service/impl/SysDictDataServiceImpl';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysPostServiceImpl } from '../service/impl/SysPostServiceImpl';
import { SysRole } from '../model/SysRole';
import { SysUser } from '../model/SysUser';
import { SysPost } from '../model/SysPost';

/**
 * 用户信息
 *
 * @author TsMask
 */
@Controller('/system/user')
export class SysUserController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  @Inject()
  private sysPostService: SysPostServiceImpl;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  @Inject()
  private sysDictDataService: SysDictDataServiceImpl;

  /**
   * 用户信息列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:user:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const dataScopeSQL = this.contextService.getDataScopeSQL('d', 'u');
    const data = await this.sysUserService.selectUserPage(query, dataScopeSQL);
    return Result.ok(data);
  }

  /**
   * 用户信息详情
   */
  @Get('/:userId')
  @PreAuthorize({ hasPermissions: ['system:user:query'] })
  async getInfo(@Param('userId') userId: string): Promise<Result> {
    if (!userId) return Result.err();
    // 查询系统角色列表
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    let roles = await this.sysRoleService.selectRoleList(
      new SysRole(),
      dataScopeSQL
    );
    // 不是系统指定管理员需要排除其角色
    if (!this.contextService.isAdmin(userId)) {
      roles = roles.filter(r => r.roleId !== ADMIN_ROLE_ID);
    }
    // 查询岗位列表
    const posts = await this.sysPostService.selectPostList(new SysPost());

    // 新增用户时，用户ID为0
    if (userId === '0') {
      return Result.okData({
        user: {},
        roleIds: [],
        postIds: [],
        roles,
        posts,
      });
    }

    // 检查用户是否存在
    const sysUser = await this.sysUserService.selectUserById(userId);
    if (!sysUser) {
      return Result.errMsg('没有权限访问用户数据');
    }
    delete sysUser.password;

    // 角色ID组
    const userRoleIds = sysUser.roles.map(r => r.roleId);

    // 岗位ID组
    const userPosts = await this.sysPostService.selectPostListByUserId(
      sysUser.userId
    );
    const userPostIds = userPosts.map(p => p.postId);

    return Result.okData({
      user: sysUser,
      roleIds: userRoleIds,
      postIds: userPostIds,
      roles,
      posts,
    });
  }

  /**
   * 用户信息新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:user:add'] })
  @OperateLog({
    title: '用户信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() sysUser: SysUser): Promise<Result> {
    const { userId, userName, password, nickName } = sysUser;
    if (userId || !nickName || !userName || !password) return Result.err();

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(
      userName
    );
    if (!uniqueUserName) {
      return Result.errMsg(`新增用户【${userName}】失败，登录账号已存在`);
    }
    if (!validUsername(userName)) {
      return Result.errMsg(
        `新增用户【${userName}】失败，登录账号不能以数字开头，可包含大写小写字母，数字，且不少于5位`
      );
    }
    if (!validPassword(password)) {
      return Result.errMsg(
        `新增用户【${userName}】失败，登录密码至少包含大小写字母、数字、特殊符号，且不少于6位`
      );
    }
    // 检查手机号码格式并判断是否唯一
    if (sysUser.phonenumber) {
      if (validMobile(sysUser.phonenumber)) {
        const uniquePhone = await this.sysUserService.checkUniquePhone(
          sysUser.phonenumber
        );
        if (!uniquePhone) {
          return Result.errMsg(`新增用户【${userName}】失败，手机号码已存在`);
        }
      } else {
        return Result.errMsg(`新增用户【${userName}】失败，手机号码格式错误`);
      }
    }
    // 检查邮箱格式并判断是否唯一
    if (sysUser.email) {
      if (validEmail(sysUser.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueEmail(
          sysUser.email
        );
        if (!uniqueEmail) {
          return Result.errMsg(`新增用户【${userName}】失败，邮箱已存在`);
        }
      } else {
        return Result.errMsg(`新增用户【${userName}】失败，邮箱格式错误`);
      }
    }

    sysUser.createBy = this.contextService.getUseName();
    const insertId = await this.sysUserService.insertUser(sysUser);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 用户信息修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  @OperateLog({
    title: '用户信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() sysUser: SysUser): Promise<Result> {
    const { userId, userName, password, nickName } = sysUser;
    if (!userId || !nickName || !userName || password) return Result.err();
    // 检查是否管理员用户
    if (this.contextService.isAdmin(userId)) {
      return Result.errMsg('不允许操作管理员用户');
    }
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(
      userName,
      userId
    );
    if (!uniqueUserName) {
      return Result.errMsg(
        `修改用户【${sysUser.userName}】失败，登录账号已存在`
      );
    }
    // 检查手机号码格式并判断是否唯一
    if (sysUser.phonenumber) {
      if (validMobile(sysUser.phonenumber)) {
        const uniquePhone = await this.sysUserService.checkUniquePhone(
          sysUser.phonenumber,
          userId
        );
        if (!uniquePhone) {
          return Result.errMsg(`修改用户【${userName}】失败，手机号码已存在`);
        }
      } else {
        return Result.errMsg(`修改用户【${userName}】失败，手机号码格式错误`);
      }
    }
    // 检查邮箱格式并判断是否唯一
    if (sysUser.email) {
      if (validEmail(sysUser.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueEmail(
          sysUser.email,
          userId
        );
        if (!uniqueEmail) {
          return Result.errMsg(`修改用户【${userName}】失败，邮箱已存在`);
        }
      } else {
        return Result.errMsg(`修改用户【${userName}】失败，邮箱格式错误`);
      }
    }

    sysUser.userName = ''; // 忽略修改登录用户名称
    sysUser.password = ''; // 忽略修改密码
    sysUser.loginIp = ''; // 忽略登录IP
    sysUser.loginDate = 0; // 忽略登录时间
    sysUser.updateBy = this.contextService.getUseName();
    const rows = await this.sysUserService.updateUserAndRolePost(sysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户信息删除
   */
  @Del('/:userIds')
  @PreAuthorize({ hasPermissions: ['system:user:remove'] })
  @OperateLog({
    title: '用户信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('userIds') userIds: string): Promise<Result> {
    if (!userIds) return Result.err();
    // 处理字符转id数组
    const ids = userIds.split(',');
    if (ids.length <= 0) return Result.err();

    // 检查是否管理员用户
    const loginUserId = this.contextService.getUserId();
    if (ids.length <= 0) return Result.err();
    for (const id of ids) {
      if (id === loginUserId) {
        return Result.errMsg('当前用户不能删除');
      }
      if (this.contextService.isAdmin(id)) {
        return Result.errMsg('不允许操作管理员用户');
      }
    }

    const rows = await this.sysUserService.deleteUserByIds([...new Set(ids)]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户重置密码
   */
  @Put('/resetPwd')
  @PreAuthorize({ hasPermissions: ['system:user:resetPwd'] })
  @OperateLog({
    title: '用户信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async resetPwd(
    @Body('userId') userId: string,
    @Body('password') password: string
  ): Promise<Result> {
    // 修改的用户ID和密码是否可用
    if (!userId || !password) return Result.err();

    // 检查是否管理员用户
    if (this.contextService.isAdmin(userId)) {
      return Result.errMsg('不允许操作管理员用户');
    }

    // 检查是否存在
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }

    if (!validPassword(password)) {
      return Result.errMsg(
        '登录密码至少包含大小写字母、数字、特殊符号，且不少于6位'
      );
    }

    user.password = password;
    user.updateBy = this.contextService.getUseName();
    const rows = await this.sysUserService.updateUser(user);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户状态修改
   */
  @Put('/changeStatus')
  @RepeatSubmit()
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  @OperateLog({
    title: '用户信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async changeStatus(
    @Body('userId') userId: string,
    @Body('status') status: string
  ): Promise<Result> {
    if (!userId || !status || status.length > 1) return Result.err();

    // 检查是否管理员用户
    if (this.contextService.isAdmin(userId)) {
      return Result.errMsg('不允许操作管理员用户');
    }

    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }

    // 与旧值相等不变更
    if (user.status === status) {
      return Result.errMsg('变更状态与旧值相等！');
    }

    user.status = status;
    user.updateBy = this.contextService.getUseName();
    const rows = await this.sysUserService.updateUser(user);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户信息列表导出
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:user:export'] })
  @OperateLog({
    title: '用户信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const dataScopeSQL = this.contextService.getDataScopeSQL('d', 'u');
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysUserService.selectUserPage(query, dataScopeSQL);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 读取用户性别字典数据
    const dictSysUserSex = await this.sysDictDataService.selectDictDataByType(
      'sys_user_sex'
    );
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysUser) => {
        const sysUserSex = dictSysUserSex.find(
          item => item.dictValue === cur.sex
        );
        pre.push({
          用户编号: cur.userId,
          登录名称: cur.userName,
          用户名称: cur.nickName,
          用户邮箱: cur.email,
          手机号码: cur.phonenumber,
          用户性别: sysUserSex.dictLabel,
          帐号状态: ['停用', '正常'][+cur.status],
          部门编号: cur?.dept?.deptId ?? '',
          部门名称: cur?.dept?.deptName ?? '',
          部门负责人: cur?.dept?.leader ?? '',
          最后登录IP: cur.loginIp,
          最后登录时间: parseDateToStr(+cur.loginDate),
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `user_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.excelWriteRecord(rows, fileName);
  }

  /**
   * 用户信息列表导入模板下载
   */
  @Get('/importTemplate')
  @PreAuthorize({ hasPermissions: ['system:user:import'] })
  async importTemplate() {
    const ctx = this.contextService.getContext();
    const fileName = `user_import_template_${Date.now()}.xlsx`;
    ctx.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'Content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.readAssetsFileStream(
      'template/excel/user_import_template.xlsx'
    );
  }

  /**
   * 用户信息列表导入
   */
  @Post('/importData')
  @PreAuthorize({ hasPermissions: ['system:user:import'] })
  @OperateLog({
    title: '用户信息',
    businessType: OperatorBusinessTypeEnum.IMPORT,
  })
  async importData(
    @Files('file') files: UploadFileInfo<string>[],
    @Fields('updateSupport') updateSupport: string
  ) {
    if (files.length <= 0) return Result.err();
    // 读取表格数据
    const rows = await this.fileService.excelReadRecord(files[0]);
    if (rows.length <= 0) {
      return Result.errMsg('导入用户数据不能为空！');
    }

    // 获取操作人名称
    const operName = this.contextService.getUseName();
    const isUpdateSupport = parseBoolean(updateSupport);

    // 读取默认初始密码
    const initPassword = await this.sysConfigService.selectConfigValueByKey(
      'sys.user.initPassword'
    );
    // 读取用户性别字典数据
    const dictSysUserSex = await this.sysDictDataService.selectDictDataByType(
      'sys_user_sex'
    );

    // 导入记录
    let successNum = 0;
    let failureNum = 0;
    const successMsgArr: string[] = [];
    const failureMsgArr: string[] = [];
    const mustItemArr = ['登录名称', '用户名称'];
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
        if (v.dictLabel === item['用户性别']) {
          sysUserSex = v.dictValue;
          break;
        }
      }

      let sysUserStatus = STATUS_NO;
      if (item['帐号状态'] === '正常') {
        sysUserStatus = STATUS_YES;
      }

      // 验证是否存在这个用户
      const newSysUser = await this.sysUserService.selectUserByUserName(
        item['登录名称']
      );
      newSysUser.userType = 'sys';
      newSysUser.password = initPassword;
      newSysUser.deptId = item['部门编号'];
      newSysUser.userName = item['登录名称'];
      newSysUser.nickName = item['用户名称'];
      newSysUser.phonenumber = item['手机号码'];
      newSysUser.email = item['用户邮箱'];
      newSysUser.status = sysUserStatus;
      newSysUser.sex = sysUserSex;

      // 行用户编号
      const rowNo = item['用户编号'];

      // 检查手机号码格式并判断是否唯一
      if (newSysUser.phonenumber) {
        if (validMobile(newSysUser.phonenumber)) {
          const uniquePhone = await this.sysUserService.checkUniquePhone(
            newSysUser.phonenumber,
            ''
          );
          if (!uniquePhone) {
            const msg = `用户编号：${rowNo} 手机号码：${newSysUser.phonenumber} 已存在`;
            failureNum++;
            failureMsgArr.push(msg);
            continue;
          }
        } else {
          const msg = `用户编号：${rowNo} 手机号码：${newSysUser.phonenumber} 格式错误`;
          failureNum++;
          failureMsgArr.push(msg);
          continue;
        }
      }

      // 检查邮箱格式并判断是否唯一
      if (newSysUser.email) {
        if (validEmail(newSysUser.email)) {
          const uniqueEmail = await this.sysUserService.checkUniqueEmail(
            newSysUser.email,
            ''
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
        newSysUser.createBy = operName;
        const insertId = await this.sysUserService.insertUser(newSysUser);
        if (insertId) {
          const msg = `用户编号：${rowNo} 登录名称：${newSysUser.userName} 导入成功`;
          successNum++;
          successMsgArr.push(msg);
        } else {
          const msg = `用户编号：${rowNo} 登录名称：${newSysUser.userName} 导入失败`;
          failureNum++;
          failureMsgArr.push(msg);
        }
        continue;
      }

      // 如果用户已存在 同时 是否更新支持
      if (newSysUser.userId && isUpdateSupport) {
        newSysUser.updateBy = operName;
        const rows = await this.sysUserService.updateUser(newSysUser);
        if (rows > 0) {
          const msg = `用户编号：${rowNo} 登录名称：${newSysUser.userName} 更新成功`;
          successNum++;
          successMsgArr.push(msg);
        } else {
          const msg = `用户编号：${rowNo} 登录名称：${newSysUser.userName} 更新失败`;
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

    return Result.okMsg(message);
  }
}
