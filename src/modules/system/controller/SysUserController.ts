import {
  Body,
  Controller,
  Del,
  Files,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { SysDept } from '../model/SysDept';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysPostServiceImpl } from '../service/impl/SysPostServiceImpl';
import { SysPost } from '../model/SysPost';
import { ContextService } from '../../../framework/service/ContextService';
import {
  parseBoolean,
  parseNumber,
} from '../../../framework/utils/ValueParseUtils';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { FileService } from '../../../framework/service/FileService';
import { UploadFileInfo } from '@midwayjs/upload';
import { SysDictDataServiceImpl } from '../service/impl/SysDictDataServiceImpl';
import { parseDateToStr } from '../../../framework/utils/DateUtils';
import { validEmail, validMobile } from '../../../framework/utils/RegularUtils';
import { RepeatSubmit } from '../../../framework/decorator/RepeatSubmitMethodDecorator';
import { ADMIN_ROLE_ID } from '../../../framework/constants/AdminConstants';
import { SysDictData } from '../model/SysDictData';
import { SysRole } from '../model/SysRole';
import { SysUser } from '../model/SysUser';

/**
 * 用户信息
 *
 * @author TsMask <340112800@qq.com>
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
  private sysDeptService: SysDeptServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  @Inject()
  private sysPostService: SysPostServiceImpl;

  @Inject()
  private sysDictDataService: SysDictDataServiceImpl;

  /**
   * 下载导入用户模板
   */
  @Post('/importTemplate')
  async importTemplate() {
    const ctx = this.contextService.getContext();
    const fileName = `user_import_template_${Date.now()}.xlsx`;
    ctx.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set('Content-disposition', `attachment;filename=${fileName}`);
    return await this.fileService.readAssetsFile(
      '/template/excel/user_import_template.xlsx'
    );
  }

  /**
   * 导入用户模板数据
   */
  @Post('/importData')
  @PreAuthorize({ hasPermissions: ['system:user:import'] })
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.IMPORT })
  async importData(
    @Files('file') files: UploadFileInfo<string>[],
    updateSupport: string
  ) {
    if (files.length <= 0) return Result.err();
    // 读取表格数据
    const sheetItemArr = await this.fileService.readExcelFile(
      files[0].data,
      files[0].filename
    );
    if (sheetItemArr.length <= 0)
      return Result.errMsg('导入用户数据不能为空！');
    // 获取操作人名称
    const operName = this.contextService.getUseName();
    const message = await this.sysUserService.importUser(
      sheetItemArr,
      parseBoolean(updateSupport),
      operName
    );
    return Result.okMsg(message);
  }

  /**
   * 导出用户数据
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:user:export'] })
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.EXPORT })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const dataScopeSQL = this.contextService.getDataScopeSQL('d', 'u');
    ctx.request.body.pageNum = 1;
    ctx.request.body.pageSize = 1000;
    const data = await this.sysUserService.selectUserPage(
      ctx.request.body,
      dataScopeSQL
    );
    // 读取用户性别字典数据
    const sysUserSexSDD = new SysDictData();
    sysUserSexSDD.dictType = 'sys_user_sex';
    const sysUserSexSDDList = await this.sysDictDataService.selectDictDataList(
      sysUserSexSDD
    );
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysUser) => {
        const sysUserSex = sysUserSexSDDList.find(
          sdd => sdd.dictValue === cur.sex
        );
        pre.push({
          用户序号: cur.userId,
          登录名称: cur.userName,
          用户名称: cur.nickName,
          用户邮箱: cur.email,
          手机号码: cur.phonenumber,
          用户性别: sysUserSex.dictLabel,
          帐号状态: cur.status === '0' ? '正常' : '停用',
          最后登录IP: cur.loginIp,
          最后登录时间: parseDateToStr(new Date(+cur.loginDate)),
          部门名称: cur?.dept?.deptName,
          部门负责人: cur?.dept?.leader,
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
    return await this.fileService.writeExcelFile(rows, '用户信息', fileName);
  }

  /**
   * 用户列表
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
   * 用户信息
   */
  @Get('/')
  @Get('/:userId')
  @PreAuthorize({ hasPermissions: ['system:user:query'] })
  async getInfo(@Param('userId') userId: string): Promise<Result> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    let roles = await this.sysRoleService.selectRoleList(
      new SysRole(),
      dataScopeSQL
    );
    const posts = await this.sysPostService.selectPostList(new SysPost());
    // 不是系统指定管理员需要排除其角色
    if (!this.contextService.isAdmin(userId)) {
      roles = roles.filter(r => r.roleId !== ADMIN_ROLE_ID);
    }
    // 检查用户是否存在
    const sysUser = await this.sysUserService.selectUserById(userId);
    if (sysUser && sysUser.userId) {
      const userRoleIds = sysUser.roles.map(r => r.roleId);
      const userPostIds = await this.sysPostService.selectPostListByUserId(
        sysUser.userId
      );
      delete sysUser.password;
      return Result.ok({
        data: sysUser,
        roleIds: userRoleIds,
        postIds: userPostIds,
        roles,
        posts,
      });
    }
    return Result.ok({
      roles,
      posts,
    });
  }

  /**
   * 用户信息新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:user:add'] })
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.INSERT })
  async add(@Body() sysUser: SysUser): Promise<Result> {
    if (
      sysUser.userId ||
      !sysUser.nickName ||
      !sysUser.userName ||
      !sysUser.password
    )
      return Result.err();
    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(
      sysUser
    );
    if (!uniqueUserName) {
      return Result.errMsg(
        `新增用户【${sysUser.userName}】失败，登录账号已存在`
      );
    }
    // 检查手机号码格式并判断是否唯一
    if (sysUser.phonenumber) {
      if (validMobile(sysUser.phonenumber)) {
        const uniquePhone = await this.sysUserService.checkUniquePhone(sysUser);
        if (!uniquePhone) {
          return Result.errMsg(
            `新增用户【${sysUser.userName}】失败，手机号码已存在`
          );
        }
      } else {
        return Result.errMsg(
          `新增用户【${sysUser.userName}】失败，手机号码格式错误`
        );
      }
    }
    // 检查邮箱格式并判断是否唯一
    if (sysUser.email) {
      if (validEmail(sysUser.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueEmail(sysUser);
        if (!uniqueEmail) {
          return Result.errMsg(
            `新增用户【${sysUser.userName}】失败，邮箱已存在`
          );
        }
      } else {
        return Result.errMsg(
          `新增用户【${sysUser.userName}】失败，邮箱格式错误`
        );
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
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async edit(@Body() sysUser: SysUser): Promise<Result> {
    // 修改的用户ID是否可用
    const userId: string = sysUser.userId;
    if (!userId || !sysUser.userName || !sysUser.nickName || sysUser.password)
      return Result.err();
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
      sysUser
    );
    if (!uniqueUserName) {
      return Result.errMsg(
        `修改用户【${sysUser.userName}】失败，登录账号已存在`
      );
    }
    // 检查手机号码格式并判断是否唯一
    if (sysUser.phonenumber) {
      if (validMobile(sysUser.phonenumber)) {
        const uniquePhone = await this.sysUserService.checkUniquePhone(sysUser);
        if (!uniquePhone) {
          return Result.errMsg(
            `修改用户【${sysUser.userName}】失败，手机号码已存在`
          );
        }
      } else {
        return Result.errMsg(
          `修改用户【${sysUser.userName}】失败，手机号码格式错误`
        );
      }
    }
    // 检查邮箱格式并判断是否唯一
    if (sysUser.email) {
      if (validEmail(sysUser.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueEmail(sysUser);
        if (!uniqueEmail) {
          return Result.errMsg(
            `修改用户【${sysUser.userName}】失败，邮箱已存在`
          );
        }
      } else {
        return Result.errMsg(
          `修改用户【${sysUser.userName}】失败，邮箱格式错误`
        );
      }
    }

    sysUser.updateBy = this.contextService.getUseName();
    const rows = await this.sysUserService.updateUserAndRolePost(sysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户信息删除
   */
  @Del('/:userIds')
  @PreAuthorize({ hasPermissions: ['system:user:remove'] })
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.DELETE })
  async remove(@Param('userIds') userIds: string): Promise<Result> {
    if (!userIds) return Result.err();
    // 处理字符转id数组
    const ids = userIds.split(',');
    if (ids.length <= 0) return Result.err();
    if (ids.includes(this.contextService.getUserId())) {
      return Result.errMsg('当前用户不能删除');
    }
    const rows = await this.sysUserService.deleteUserByIds([...new Set(ids)]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户重置密码
   */
  @Put('/resetPwd')
  @PreAuthorize({ hasPermissions: ['system:user:resetPwd'] })
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.UPDATE })
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
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    const sysUser = new SysUser();
    sysUser.userId = userId;
    sysUser.password = password;
    sysUser.updateBy = this.contextService.getUseName();
    const rows = await this.sysUserService.updateUser(sysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户状态修改
   */
  @Put('/changeStatus')
  @RepeatSubmit()
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async changeStatus(
    @Body('userId') userId: string,
    @Body('status') status: string
  ): Promise<Result> {
    if (!userId) return Result.err();
    // 检查是否管理员用户
    if (this.contextService.isAdmin(userId)) {
      return Result.errMsg('不允许操作管理员用户');
    }
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    const sysUser = new SysUser();
    sysUser.userId = userId;
    sysUser.status = `${parseNumber(status)}`;
    sysUser.updateBy = this.contextService.getUseName();
    const rows = await this.sysUserService.updateUser(sysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户授权角色信息
   */
  @Get('/authRole/:userId')
  @PreAuthorize({ hasPermissions: ['system:user:query'] })
  async authRoleInfo(@Param('userId') userId: string): Promise<Result> {
    // 修改的用户ID是否可用
    if (!userId) return Result.err();
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    delete user.password;
    // 不是系统指定管理员需要排除其角色
    let roles = await this.sysRoleService.selectRolesByUserId(userId);
    if (!this.contextService.isAdmin(userId)) {
      roles = roles.filter(r => r.roleId !== ADMIN_ROLE_ID);
    }
    return Result.ok({
      user,
      roles,
    });
  }

  /**
   * 用户授权角色修改
   */
  @Put('/authRole')
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  @OperLog({ title: '用户信息', businessType: OperatorBusinessTypeEnum.GRANT })
  async authRoleAdd(
    @Body('userId') userId: string,
    @Body('roleIds') roleIds: string
  ): Promise<Result> {
    if (!userId) return Result.err();
    // 处理字符转id数组
    const ids = roleIds.split(',');
    if (ids.length <= 0) return Result.err();
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    await this.sysUserService.insertAserAuth(userId, [...new Set(ids)]);
    return Result.ok();
  }

  /**
   * 用户部门树列表
   */
  @PreAuthorize({ hasPermissions: ['system:user:list'] })
  @Get('/deptTree')
  async deptTree(@Query() sysDept: SysDept): Promise<Result> {
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const data = await this.sysDeptService.selectDeptTreeList(
      sysDept,
      dataScopeSQL
    );
    return Result.okData(data || []);
  }
}
