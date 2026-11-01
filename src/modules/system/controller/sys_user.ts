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
    return Resp.okData({ rows: rows, total });
  }

  /**用户信息详情 */
  @Get('/:id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:user:query'] })],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') user_id: number
  ): Promise<Resp> {
    if (user_id < 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: user_id is empty');
    }

    // 查询系统角色列表
    const roles = await this.sysRoleService.find(new SysRole());
    // 查询系统岗位列表
    const posts = await this.sysPostService.find(new SysPost());

    // 新增用户时，用户ID为0
    if (user_id === 0) {
      return Resp.okData({
        user: {},
        role_ids: [],
        post_ids: [],
        roles: roles,
        posts: posts,
      });
    }

    // 检查用户是否存在
    const userInfo = await this.sysUserService.findById(user_id);
    if (userInfo.id !== user_id) {
      return Resp.errMsg('没有权限访问用户数据！');
    }
    delete (userInfo as Partial<SysUser>).user_password;

    // 角色ID组
    const role_ids = userInfo.roles.map(r => r.id);

    // 岗位ID组
    const userPosts = await this.sysPostService.findByUserId(userInfo.id);
    const post_ids = userPosts.map(p => p.id);

    return Resp.okData({
      user: userInfo,
      role_ids: role_ids,
      post_ids: post_ids,
      roles: roles,
      posts: posts,
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
  public async add(@Body() body: SysUser): Promise<Resp> {
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: user_id not is empty');
    }
    if (!validUsername(body.user_name)) {
      return Resp.errMsg(
        `新增用户【${body.user_name}】失败，登录账号用户账号只能包含大写小写字母，数字，且不少于4位`
      );
    }
    if (!validPassword(body.user_password)) {
      return Resp.errMsg(
        `新增用户【${body.user_name}】失败，登录密码至少包含大小写字母、数字、特殊符号，且不少于6位`
      );
    }

    // 检查用户登录账号是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueByUserName(
      body.user_name,
      0
    );
    if (!uniqueUserName) {
      return Resp.errMsg(`新增用户【${body.user_name}】失败，登录账号已存在`);
    }

    // 检查手机号码格式并判断是否唯一
    if (body.user_phone) {
      if (validMobile(body.user_phone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          body.user_phone,
          0
        );
        if (!uniquePhone) {
          return Resp.errMsg(
            `新增用户【${body.user_name}】失败，手机号码已存在`
          );
        }
      } else {
        return Resp.errMsg(
          `新增用户【${body.user_name}】失败，手机号码格式错误`
        );
      }
    }

    // 检查邮箱格式并判断是否唯一
    if (body.user_email) {
      if (validEmail(body.user_email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          body.user_email,
          0
        );
        if (!uniqueEmail) {
          return Resp.errMsg(`新增用户【${body.user_name}】失败，邮箱已存在`);
        }
      } else {
        return Resp.errMsg(`新增用户【${body.user_name}】失败，邮箱格式错误`);
      }
    }

    const sysUser = new SysUser();
    sysUser.user_name = body.user_name;
    sysUser.user_password = body.user_password;
    sysUser.user_nick = body.user_nick;
    sysUser.user_email = body.user_email;
    sysUser.user_phone = body.user_phone;
    sysUser.user_gender = body.user_gender;
    sysUser.user_status = body.user_status;
    sysUser.remark = body.remark;
    sysUser.dept_id = body.dept_id; // 部门ID
    sysUser.role_ids = body.role_ids; // 角色ID组
    sysUser.post_ids = body.post_ids; // 岗位ID组
    sysUser.user_avatar = body.user_avatar;
    sysUser.create_by = loginUserToUserName(this.c);
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
  public async edit(@Body() body: SysUser): Promise<Resp> {
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: user_id is empty');
    }

    // 检查是否系统管理员用户
    if (this.config.isSystemUser(body.id)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }

    // 检查是否存在
    const userInfo = await this.sysUserService.findById(body.id);
    if (userInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 检查手机号码格式并判断是否唯一
    if (body.user_phone) {
      if (validMobile(body.user_phone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          body.user_phone,
          body.id
        );
        if (!uniquePhone) {
          return Resp.errMsg(
            `修改用户【${userInfo.user_name}】失败，手机号码已存在`
          );
        }
      } else {
        return Resp.errMsg(
          `修改用户【${userInfo.user_name}】失败，手机号码格式错误`
        );
      }
    }

    // 检查邮箱格式并判断是否唯一
    if (body.user_email) {
      if (validEmail(body.user_email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          body.user_email,
          body.id
        );
        if (!uniqueEmail) {
          return Resp.errMsg(
            `修改用户【${userInfo.user_name}】失败，邮箱已存在`
          );
        }
      } else {
        return Resp.errMsg(
          `修改用户【${userInfo.user_name}】失败，邮箱格式错误`
        );
      }
    }

    if (body.user_avatar) {
      userInfo.user_avatar = body.user_avatar;
    }
    userInfo.user_phone = body.user_phone;
    userInfo.user_email = body.user_email;
    userInfo.user_gender = body.user_gender;
    userInfo.user_status = body.user_status;
    userInfo.remark = body.remark;
    userInfo.dept_id = body.dept_id;
    userInfo.role_ids = body.role_ids;
    userInfo.post_ids = body.post_ids;
    userInfo.user_password = ''; // 忽略修改密码
    userInfo.update_by = loginUserToUserName(this.c);
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
    @Valid(Joi.string().allow('')) @Param('id') user_id: string
  ): Promise<Resp> {
    if (user_id === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: user_id is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(user_id, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    // 检查是否管理员用户
    const loginUserId = loginUserToUserID(this.c);
    for (const id of ids) {
      if (id === loginUserId) {
        return Resp.errMsg('当前用户不能删除');
      }
      if (this.config.isSystemUser(id)) {
        return Resp.errMsg('不允许操作系统管理员用户');
      }
    }

    const [rows, err] = await this.sysUserService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功：${rows}`);
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
    @Valid(Joi.number().required()) @Body('user_id') user_id: number,
    @Valid(Joi.string().required()) @Body('password') password: string
  ): Promise<Resp> {
    // 检查是否系统管理员用户
    if (this.config.isSystemUser(user_id)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }

    if (!validPassword(password)) {
      return Resp.errMsg(
        '登录密码至少包含大小写字母、数字、特殊符号，且不少于6位'
      );
    }

    // 检查是否存在
    const userInfo = await this.sysUserService.findById(user_id);
    if (userInfo.id !== user_id) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    userInfo.user_password = password;
    userInfo.update_by = loginUserToUserName(this.c);
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
    @Valid(Joi.number().required()) @Body('user_id') user_id: number,
    @Valid(Joi.string().required()) @Body('user_status') user_status: string
  ): Promise<Resp> {
    // 检查是否系统管理员用户
    if (this.config.isSystemUser(user_id)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }
    // 检查是否存在
    const userInfo = await this.sysUserService.findById(user_id);
    if (userInfo.id !== user_id) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 与旧值相等不变更
    if (userInfo.user_status === user_status) {
      return Resp.errMsg('变更状态与旧值相等！');
    }

    userInfo.user_status = user_status;
    userInfo.user_password = ''; // 密码不更新
    userInfo.update_by = loginUserToUserName(this.c);
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
    @Valid(Joi.string().allow('')) @Param('user_name') user_name: string
  ): Promise<Resp> {
    if (!user_name) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: user_name is empty');
    }
    const ok = await this.accountService.clearLoginRecordCache(user_name);
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
}
