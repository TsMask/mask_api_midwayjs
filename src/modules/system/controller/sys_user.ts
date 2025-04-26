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
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  validUsername,
  validPassword,
  validMobile,
  validEmail,
} from '../../../framework/utils/regular/regular';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import {
  loginUserToDataScopeSQL,
  loginUserToUserID,
  loginUserToUserName,
} from '../../../framework/reqctx/auth';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { RepeatSubmitMiddleware } from '../../../framework/middleware/repeat_submit';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { Resp } from '../../../framework/resp/api';
import { GlobalConfig } from '../../../framework/config/config';
import { FileUtil } from '../../../framework/utils/file/file';
import { readSheet } from '../../../framework/utils/file/execl';
import { AccountService } from '../../auth/service/account';
import { SysUserService } from '../service/sys_user';
import { SysRoleService } from '../service/sys_role';
import { SysPostService } from '../service/sys_post';
import { SysRole } from '../model/sys_role';
import { SysUser } from '../model/sys_user';
import { SysPost } from '../model/sys_post';

/**用户信息 控制层处理 */
@Controller('/system/user')
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
    const dataScopeSQL = loginUserToDataScopeSQL(
      this.c,
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysUserService.findByPage(
      query,
      dataScopeSQL
    );
    return Resp.okData({ rows, total });
  }

  /**用户信息详情 */
  @Get('/:userId', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:user:query'] })],
  })
  public async info(
    @Valid(RuleType.number()) @Param('userId') userId: number
  ): Promise<Resp> {
    if (userId < 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: userId is empty');
    }

    // 查询系统角色列表
    const roles = await this.sysRoleService.find(new SysRole());
    // 查询系统岗位列表
    const posts = await this.sysPostService.find(new SysPost());

    // 新增用户时，用户ID为0
    if (userId === 0) {
      return Resp.okData({
        user: {},
        roleIds: [],
        postIds: [],
        roles: roles,
        posts: posts,
      });
    }

    // 检查用户是否存在
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.userId !== userId) {
      return Resp.errMsg('没有权限访问用户数据');
    }
    delete userInfo.password;

    // 角色ID组
    const roleIds = userInfo.roles.map(r => r.roleId);

    // 岗位ID组
    const userPosts = await this.sysPostService.findByUserId(userInfo.userId);
    const postIds = userPosts.map(p => p.postId);

    return Resp.okData({
      user: userInfo,
      roleIds: roleIds,
      postIds: postIds,
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
    if (body.userId > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: userId not is empty');
    }
    if (!validUsername(body.userName)) {
      return Resp.errMsg(
        `新增用户【${body.userName}】失败，登录账号用户账号只能包含大写小写字母，数字，且不少于4位`
      );
    }
    if (!validPassword(body.password)) {
      return Resp.errMsg(
        `新增用户【${body.userName}】失败，登录密码至少包含大小写字母、数字、特殊符号，且不少于6位`
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
    if (body.phone) {
      if (validMobile(body.phone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          body.phone,
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
    if (body.email) {
      if (validEmail(body.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          body.email,
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
    sysUser.password = body.password;
    sysUser.nickName = body.nickName;
    sysUser.email = body.email;
    sysUser.phone = body.phone;
    sysUser.sex = body.sex;
    sysUser.statusFlag = body.statusFlag;
    sysUser.remark = body.remark;
    sysUser.deptId = body.deptId; // 部门ID
    sysUser.roleIds = body.roleIds; // 角色ID组
    sysUser.postIds = body.postIds; // 岗位ID组
    sysUser.avatar = body.avatar;
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
  public async edit(@Body() body: SysUser): Promise<Resp> {
    if (body.userId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: userId is empty');
    }

    // 检查是否系统管理员用户
    if (this.config.isSystemUser(body.userId)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }

    // 检查是否存在
    const userInfo = await this.sysUserService.findById(body.userId);
    if (userInfo.userId !== body.userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 检查手机号码格式并判断是否唯一
    if (body.phone) {
      if (validMobile(body.phone)) {
        const uniquePhone = await this.sysUserService.checkUniqueByPhone(
          body.phone,
          body.userId
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
    if (body.email) {
      if (validEmail(body.email)) {
        const uniqueEmail = await this.sysUserService.checkUniqueByEmail(
          body.email,
          body.userId
        );
        if (!uniqueEmail) {
          return Resp.errMsg(
            `修改用户【${userInfo.userName}】失败，邮箱已存在`
          );
        }
      } else {
        return Resp.errMsg(
          `修改用户【${userInfo.userName}】失败，邮箱格式错误`
        );
      }
    }

    userInfo.phone = body.phone;
    userInfo.email = body.email;
    userInfo.sex = body.sex;
    userInfo.statusFlag = body.statusFlag;
    userInfo.remark = body.remark;
    userInfo.deptId = body.deptId;
    userInfo.roleIds = body.roleIds;
    userInfo.postIds = body.postIds;
    userInfo.password = ''; // 忽略修改密码
    userInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysUserService.updateUserAndRolePost(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**用户信息删除 */
  @Del('/:userId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:remove'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.string().allow('')) @Param('userId') userId: string
  ): Promise<Resp> {
    if (userId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: userId is empty');
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
      AuthorizeUserMiddleware({ hasPerms: ['system:user:resetPwd'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async password(
    @Valid(RuleType.number().required()) @Body('userId') userId: number,
    @Valid(RuleType.string().required()) @Body('password') password: string
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
    if (userInfo.userId !== userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    userInfo.password = password;
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
    @Valid(RuleType.number().required()) @Body('userId') userId: number,
    @Valid(RuleType.string().required()) @Body('statusFlag') statusFlag: string
  ): Promise<Resp> {
    // 检查是否系统管理员用户
    if (this.config.isSystemUser(userId)) {
      return Resp.errMsg('不允许操作系统管理员用户');
    }
    // 检查是否存在
    const userInfo = await this.sysUserService.findById(userId);
    if (userInfo.userId !== userId) {
      return Resp.errMsg('没有权限访问用户数据！');
    }

    // 与旧值相等不变更
    if (userInfo.statusFlag === statusFlag) {
      return Resp.errMsg('变更状态与旧值相等！');
    }

    userInfo.statusFlag = statusFlag;
    userInfo.password = ''; // 密码不更新
    userInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysUserService.update(userInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**用户账户解锁 */
  @Put('/unlock/:userName', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:user:unlock'] }),
      OperateLogMiddleware({
        title: '用户信息',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async unlock(
    @Valid(RuleType.string().allow('')) @Param('userName') userName: string
  ): Promise<Resp> {
    if (!userName) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: userName is empty');
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
    const dataScopeSQL = loginUserToDataScopeSQL(
      this.c,
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysUserService.findByPage(
      query,
      dataScopeSQL
    );
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `user_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysUserService.exportData(rows, fileName);
  }

  /**用户信息列表导入模板下载 */
  @Get('/import/template', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:user:import'] })],
  })
  public async template() {
    const fileName = `user_import_template_${Date.now()}.xlsx`;
    this.c.set(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'Content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );

    const [fileData, err] = await this.fileUtil.readAssetsFileStream(
      'template/excel/user_import_template.xlsx'
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
    @Valid(RuleType.string().required()) @Body('filePath') filePath: string,
    @Valid(RuleType.boolean().required()) @Body('update') update: boolean
  ): Promise<Resp> {
    // 表格文件绝对地址
    const fileAbsPath = this.fileUtil.parseUploadFileAbsPath(filePath);
    // 读取表格数据
    const [rows, err] = await readSheet(fileAbsPath);
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
