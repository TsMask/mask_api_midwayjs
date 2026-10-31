import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  validUsername,
  validPassword,
  validMobile,
  validEmail,
} from '../../../internal/shared/regular/regular';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../internal/shared/parse/parse';
import {
  loginUserToDataScopeSQL,
  loginUserToUserID,
  loginUserToUserName,
} from '../../../internal/web/reqctx/auth';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { RepeatSubmitMiddleware } from '../../../internal/web/middleware/repeat_submit';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { GlobalConfig } from '../../../internal/config/config';
import { FileUtil } from '../../../internal/shared/file/file';
import { AccountService } from '../../auth/service/account';
import { SysUserService } from '../service/sys_user';
import { SysRoleService } from '../service/sys_role';
import { SysPostService } from '../service/sys_post';
import { SysRole } from '../model/sys_role';
import { SysUser } from '../model/sys_user';
import { SysPost } from '../model/sys_post';
import {
  serializeSysPost,
  serializeSysRole,
  serializeSysUser,
} from '../model/vo/response';

/**用户信息 控制层处理 */
@Controller('/api/v1/system/users')
export class SysUserController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**用户服务 */
  @Inject()
  private sysUserService: SysUserService;

  /**角色服务 */
  @Inject()
  private sysRoleService: SysRoleService;

  /**岗位服务 */
  @Inject()
  private sysPostService: SysPostService;

  /**账号身份操作服务 */
  @Inject()
  private accountService: AccountService;

  /**用户信息列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:user:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const filter = loginUserToDataScopeSQL(this.c, 'sys_user', 'sys_user');
    const [rows, total] = await this.sysUserService.findByPage(query, filter);
    return Resp.okData({ rows: rows.map(serializeSysUser), total });
  }

  /**用户信息详情 */
  @Get('/:id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:user:query'] })],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') userId: number
  ): Promise<Resp> {
    if (userId < 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: userId is empty');
    }

    // 查询系统角色列表
    const roles = await this.sysRoleService.find(new SysRole());
    // 查询系统岗位列表
    const posts = await this.sysPostService.find(new SysPost());

    // 新增用户时，用户ID为0
    if (userId === 0) {
      return Resp.okData({
        user: {},
        role_ids: [],
        post_ids: [],
        roles: roles.map(serializeSysRole),
        posts: posts.map(serializeSysPost),
      });
    }

    // 检查用户是否存在
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.id !== userId) {
      return Resp.errMsg('没有权限访问用户数据');
    }
    delete (userInfo as Partial<SysUser>).userPassword;

    // 角色ID组
    const roleIds = userInfo.roles.map(r => r.id);

    // 岗位ID组
    const userPosts = await this.sysPostService.findByUserId(userInfo.id);
    const postIds = userPosts.map(p => p.id);

    return Resp.okData({
      user: serializeSysUser(userInfo),
      role_ids: roleIds,
      post_ids: postIds,
      roles: roles.map(serializeSysRole),
      posts: posts.map(serializeSysPost),
    });
  }

  /**用户信息新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:add'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() rawBody: Record<string, any>): Promise<Resp> {
    const body = this.parseBody(rawBody);
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: userId not is empty');
    }
    if (!validUsername(body.userName)) {
      return Resp.errMsg(
        `新增用户【${body.userName}】失败，登录账号用户账号只能包含大写小写字母，数字，且不少于4位`
      );
    }
    if (!validPassword(body.userPassword)) {
      return Resp.errMsg(
        `新增用户【${body.userName}】失败，登录账号用户账号只能包含大写小写字母，数字，且不少于4位`
      );
    }

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueByUserName(
      body.userName,
      0
    );
    if (!uniqueUserName) {
      return Resp.errMsg(`新增用户【${body.userName}】失败，登录账号已存在`);
    }

    // 检查手机号码格式并判断是否唯一
    if (body.userPhone) {
      if (validMobile(body.userPhone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          body.userPhone,
          0
        );
        if (!uniquePhone) {
          return Resp.errMsg(
            `新增用户【${body.userName}】失败，手机号码已存在`
          );
        }
      } else {
        return Resp.errMsg(
          `新增用户【${body.userName}】失败，手机号码格式错误`
        );
      }
    }

    // 检查邮箱格式并判断是否唯一
    if (body.userEmail) {
      if (validEmail(body.userEmail)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          body.userEmail,
          0
        );
        if (!uniqueEmail) {
          return Resp.errMsg(`新增用户【${body.userName}】失败，邮箱已存在`);
        }
      } else {
        return Resp.errMsg(`新增用户【${body.userName}】失败，邮箱格式错误`);
      }
    }

    const sysUser = new SysUser();
    sysUser.userName = body.userName;
    sysUser.userPassword = body.userPassword;
    sysUser.userNick = body.userNick;
    sysUser.userEmail = body.userEmail;
    sysUser.userPhone = body.userPhone;
    sysUser.userGender = body.userGender;
    sysUser.userStatus = body.userStatus;
    sysUser.remark = body.remark;
    sysUser.deptId = body.deptId; // 部门ID
    sysUser.roleIds = body.roleIds; // 角色ID组
    sysUser.postIds = body.postIds; // 岗位ID组
    sysUser.userAvatar = body.userAvatar;
    sysUser.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysUserService.insert(sysUser);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**用户信息修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:edit'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() rawBody: Record<string, any>): Promise<Resp> {
    const body = this.parseBody(rawBody);
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: userId is empty');
    }

    // 检查是否系统管理员用户
    if (this.config.isSystemUser(body.id)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }

    // 检查是否存在
    const userInfo = await this.sysUserService.findById(body.id);
    if (userInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问用户数据');
    }

    // 检查手机号码格式并判断是否唯一
    if (body.userPhone) {
      if (validMobile(body.userPhone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          body.userPhone,
          body.id
        );
        if (!uniquePhone) {
          return Resp.errMsg(
            `修改用户【${userInfo.userName}】失败，手机号码已存在`
          );
        }
      } else {
        return Resp.errMsg(
          `修改用户【${userInfo.userName}】失败，手机号码格式错误`
        );
      }
    }

    // 检查邮箱格式并判断是否唯一
    if (body.userEmail) {
      if (validEmail(body.userEmail)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          body.userEmail,
          body.id
        );
        if (!uniqueEmail) {
          return Resp.errMsg(
            `修改用户【${userInfo.userName}】失败，手机号码已存在`
          );
        }
      } else {
        return Resp.errMsg(
          `修改用户【${userInfo.userName}】失败，手机号码格式错误`
        );
      }
    }

    if (body.userAvatar) {
      userInfo.userAvatar = body.userAvatar;
    }
    userInfo.userPhone = body.userPhone;
    userInfo.userEmail = body.userEmail;
    userInfo.userGender = body.userGender;
    userInfo.userStatus = body.userStatus;
    userInfo.remark = body.remark;
    userInfo.deptId = body.deptId;
    userInfo.roleIds = body.roleIds;
    userInfo.postIds = body.postIds;
    userInfo.userPassword = ''; // 忽略修改密码
    userInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysUserService.updateUserAndRolePost(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**用户信息删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:remove'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.string().allow('')) @Param('id') userId: string
  ): Promise<Resp> {
    if (userId === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: userId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(userId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    // 检查是否管理员用户
    const loginUserId = loginUserToUserID(this.c);
    for (const id of ids) {
      if (id === loginUserId) {
        return Resp.errMsg('当前用户不能删除');
      }
      if (this.config.isSystemUser(id)) {
        return Resp.errMsg('不允许操作管理员用户');
      }
    }

    const [rows, err] = await this.sysUserService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }

  /**用户密码修改 */
  @Put('/password', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['system:user:passwd'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async password(
    @Valid(Joi.number().required()) @Body('user_id') userId: number,
    @Valid(Joi.string().required()) @Body('password') password: string
  ): Promise<Resp> {
    // 检查是否系统管理员用户
    if (this.config.isSystemUser(userId)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }

    if (!validPassword(password)) {
      return Resp.errMsg(
        '登录密码至少包含大小写字母、数字、特殊符号，且不少于6位'
      );
    }

    // 检查是否存在
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.id !== userId) {
      return Resp.errMsg('没有权限访问用户数据');
    }

    userInfo.userPassword = password;
    userInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**用户状态修改 */
  @Put('/status', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['system:user:edit'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async status(
    @Valid(Joi.number().required()) @Body('user_id') userId: number,
    @Valid(Joi.string().required()) @Body('user_status') userStatus: string
  ): Promise<Resp> {
    // 检查是否系统管理员用户
    if (this.config.isSystemUser(userId)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }
    // 检查是否存在
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.id !== userId) {
      return Resp.errMsg('没有权限访问用户数据');
    }

    // 与旧值相等不变更
    if (userInfo.userStatus === userStatus) {
      return Resp.errMsg('变更状态与旧值相等！');
    }

    userInfo.userStatus = userStatus;
    userInfo.userPassword = ''; // 密码不更�
    userInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**用户账户解锁 */
  @Put('/unlock/:user_name', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:unlock'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async unlock(
    @Valid(Joi.string().allow('')) @Param('user_name') userName: string
  ): Promise<Resp> {
    if (!userName) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: userName is empty');
    }
    const ok = await this.accountService.clearLoginRecordCache(userName);
    if (ok) {
      return Resp.okMsg('unlock success');
    }
    return Resp.errMsg('not found unlock user');
  }

  /**用户信息列表导出 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:export'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const filter = loginUserToDataScopeSQL(this.c, 'sys_user', 'sys_user');
    const [rows, total] = await this.sysUserService.findByPage(query, filter);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `user_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysUserService.exportData(rows, fileName);
  }

  /**用户信息列表导入模板下载 */
  @Get('/import/template', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:user:import'] })],
  })
  public async template() {
    const fileName = `user_import_template_${Date.now()}.csv`;
    this.c.set('Content-Type', 'application/octet-stream');
    this.c.set(
      'Content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );

    const [fileData, err] = await this.fileUtil.readAssetsFileStream(
      'user_import_template.csv'
    );
    if (err) {
      this.c.status = 400;
      return 'failed to read file';
    }
    return fileData;
  }

  /**用户信息列表导入 */
  @Post('/import', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:import'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.IMPORT,
      }),
    ],
  })
  public async import(
    @Valid(Joi.string().required()) @Body('file_path') filePath: string,
    @Valid(Joi.boolean().required()) @Body('update') update: boolean
  ): Promise<Resp> {
    // 表格文件绝对地址
    const fileAbsPath = this.fileUtil.parseUploadFileAbsPath(filePath);
    // 读取表格数据
    const [rows, err] = await this.fileUtil.csvReadFile(fileAbsPath);
    if (err) {
      return Resp.errMsg(err);
    }
    if (rows.length <= 0) {
      return Resp.errMsg('导入用户数据不能为空！');
    }
    // 获取操作人名称
    const operaName = loginUserToUserName(this.c);
    // 导入数据
    const message = await this.sysUserService.importData(
      rows,
      operaName,
      update
    );
    return Resp.okMsg(message);
  }

  private parseBody(body: Record<string, any>): SysUser {
    const user = new SysUser();
    user.id = Number(body?.id ?? body?.userId ?? body?.ID ?? 0) || 0;
    user.deptId = Number(body?.dept_id ?? body?.deptId ?? 0) || 0;
    user.userName = String(body?.user_name ?? body?.userName ?? '');
    user.userNick = String(body?.user_nick ?? body?.nickName ?? '');
    user.userEmail = String(body?.user_email ?? body?.email ?? '');
    user.userPhone = String(body?.user_phone ?? body?.phone ?? '');
    user.userGender = String(body?.user_gender ?? body?.sex ?? '0');
    user.userAvatar = String(body?.user_avatar ?? body?.avatar ?? '');
    user.userPassword = String(body?.password ?? body?.userPassword ?? '');
    user.userStatus = String(body?.user_status ?? body?.statusFlag ?? '0');
    user.remark = String(body?.remark ?? '');
    user.roleIds = body?.role_ids ?? body?.roleIds ?? [];
    user.postIds = body?.post_ids ?? body?.postIds ?? [];
    return user;
  }
}