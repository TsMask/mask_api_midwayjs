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
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../internal/shared/parse/parse';
import {
  loginUser,
  loginUserToDataScopeSQL,
  loginUserToUserName,
} from '../../../internal/web/reqctx/auth';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import {
  CODE_AUTH_INVALID,
  CODE_PARAM_CHEACK,
} from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { RepeatSubmitMiddleware } from '../../../internal/web/middleware/repeat_submit';
import { SYS_ROLE_SYSTEM_ID } from '../../../internal/shared/constants/system';
import { SysRoleService } from '../service/sys_role';
import { SysUserService } from '../service/sys_user';
import { SysRole } from '../model/sys_role';
import { serializeSysRole, serializeSysUser } from '../model/vo/response';

/**角色信息 控制层处理 */
@Controller('/api/v1/system/roles')
export class SysRoleController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**角色服务 */
  @Inject()
  private sysRoleService: SysRoleService;

  /**用户服务 */
  @Inject()
  private sysUserService: SysUserService;

  /**角色列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:role:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysRoleService.findByPage(query);
    return Resp.okData({ rows: rows.map(serializeSysRole), total });
  }

  /**角色信息详情 */
  @Get('/:id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:role:query'] })],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') roleId: number
  ): Promise<Resp> {
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId is empty');
    }
    const data = await this.sysRoleService.findById(roleId);
    if (data.id === roleId) {
      return Resp.okData(serializeSysRole(data));
    }
    return Resp.err();
  }

  /**角色信息新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:role:add'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysRole): Promise<Resp> {
    Object.assign(body, this.parseBody(body as unknown as Record<string, any>));
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId not is empty');
    }

    // 判断角色名称是否唯一
    const uniqueName = await this.sysRoleService.checkUniqueByName(
      body.roleName,
      0
    );
    if (!uniqueName) {
      return Resp.errMsg(`角色新增【${body.roleName}】失败，角色名称已存在`);
    }

    // 判断角色键值是否唯一
    const uniqueKey = await this.sysRoleService.checkUniqueByKey(
      body.roleKey,
      0
    );
    if (!uniqueKey) {
      return Resp.errMsg(`角色新增【${body.roleName}】失败，角色名称已存在`);
    }

    body.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysRoleService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**角色信息修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:role:edit'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysRole): Promise<Resp> {
    Object.assign(body, this.parseBody(body as unknown as Record<string, any>));
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId is empty');
    }

    // 检查是否系统管理员角色
    if (body.id === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作系统管理员角色');
    }

    // 检查是否分配给当前用户
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(CODE_AUTH_INVALID, err);
    }
    if (Array.isArray(info.user.roleIds) && info.user.roleIds.length > 0) {
      if (info.user.roleIds.includes(body.id)) {
        return Resp.errMsg('不允许操作分配给自己的角色');
      }
    }

    // 判断角色名称是否唯一
    const uniqueName = await this.sysRoleService.checkUniqueByName(
      body.roleName,
      body.id
    );
    if (!uniqueName) {
      return Resp.errMsg(`角色修改【${body.roleName}】失败，角色名称已存在`);
    }

    // 判断角色键值是否唯一
    const uniqueKey = await this.sysRoleService.checkUniqueByKey(
      body.roleKey,
      body.id
    );
    if (!uniqueKey) {
      return Resp.errMsg(`角色修改【${body.roleName}】失败，角色名称已存在`);
    }

    // 检查是否存在
    const roleInfo = await this.sysRoleService.findById(body.id);
    if (roleInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    roleInfo.roleName = body.roleName;
    roleInfo.roleKey = body.roleKey;
    roleInfo.roleSort = body.roleSort;
    roleInfo.roleDataScope = body.roleDataScope;
    roleInfo.roleMenuCheckStrictly = body.roleMenuCheckStrictly;
    roleInfo.roleDeptCheckStrictly = body.roleDeptCheckStrictly;
    roleInfo.roleStatus = body.roleStatus;
    roleInfo.remark = body.remark;
    roleInfo.updateBy = loginUserToUserName(this.c);
    roleInfo.menuIds = body.menuIds;
    roleInfo.deptIds = body.deptIds;
    const rows = await this.sysRoleService.update(roleInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**角色信息删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:role:remove'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.string().allow('')) @Param('id') roleId: string
  ): Promise<Resp> {
    if (roleId === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(roleId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    // 检查是否管理员角色
    for (const id of ids) {
      if (id === SYS_ROLE_SYSTEM_ID) {
        return Resp.errMsg('不允许操作管理员角色');
      }
    }

    const [rows, err] = await this.sysRoleService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }

  /**角色状态变更 */
  @Put('/status', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['system:role:edit'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async status(
    @Valid(Joi.number().required()) @Body('role_id') roleId: number,
    @Valid(Joi.string().required()) @Body('role_status') roleStatus: string
  ): Promise<Resp> {
    // 检查是否管理员角色
    if (roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作管理员角色');
    }

    // 检查是否存在
    const role = await this.sysRoleService.findById(roleId);
    if (role.id !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    // 与旧值相等不变更
    if (role.roleStatus === roleStatus) {
      return Resp.errMsg('变更状态与旧值相等！');
    }

    // 更新状态不刷新缓存
    role.roleStatus = roleStatus;
    role.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysRoleService.update(role);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**角色数据权限修改 */
  @Put('/data-scope', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['system:role:edit'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async dataScope(
    @Valid(Joi.number().required()) @Body('role_id') roleId: number,
    @Valid(Joi.array<number>()) @Body('dept_ids') deptIds: number[],
    @Valid(
      Joi.string()
        .pattern(/^[12345]$/)
        .required()
    )
    @Body('role_data_scope')
    dataScope: string,
    @Valid(
      Joi.string()
        .pattern(/^[01]$/)
        .required()
    )
    @Body('role_dept_check_strictly')
    deptCheckStrictly: string
  ): Promise<Resp> {
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId is empty');
    }
    // 检查是否系统管理员角色
    if (roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作系统管理员角色');
    }
    // 检查是否存在
    const roleInfo = await this.sysRoleService.findById(roleId);
    if (roleInfo.id !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }
    // 更新数据权限
    roleInfo.deptIds = deptIds;
    roleInfo.roleDataScope = dataScope;
    roleInfo.roleDeptCheckStrictly = deptCheckStrictly;
    roleInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysRoleService.updateAndDataScope(roleInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**角色分配用户列表 */
  @Get('/user/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:role:auth'] })],
  })
  public async userAuthList(
    @Query() query: Record<string, string>
  ): Promise<Resp> {
    const roleId = parseNumber(query.role_id);
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: roleId is empty');
    }

    // 检查是否存在
    const role = await this.sysRoleService.findById(roleId);
    if (role.id !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    const filter = loginUserToDataScopeSQL(this.c, 'sys_user', 'sys_user');
    const [rows, total] = await this.sysUserService.findAuthUsersPage(
      query,
      filter
    );
    return Resp.okData({ rows: rows.map(serializeSysUser), total });
  }

  /**角色分配选择授权 */
  @Put('/user/auth', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:role:auth'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.GRANT,
      }),
    ],
  })
  public async userAuthChecked(
    @Valid(Joi.number().required()) @Body('role_id') roleId: number,
    @Valid(Joi.array<number>().required())
    @Body('user_ids')
    userIds: number[],
    @Valid(Joi.boolean().required()) @Body('auth') auth: boolean
  ): Promise<Resp> {
    if (userIds.length <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: userIds is empty');
    }

    // 检查是否存在
    const role = await this.sysRoleService.findById(roleId);
    if (role.id !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    let rows: number;
    if (auth) {
      rows = await this.sysRoleService.insertAuthUsers(roleId, userIds);
    } else {
      rows = await this.sysRoleService.deleteAuthUsers(roleId, userIds);
    }
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**导出角色信息 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:role:export'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysRoleService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `role_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysRoleService.exportData(rows, fileName);
  }

  private parseBody(body: Record<string, any>): Partial<SysRole> {
    return {
      id: Number(body?.id ?? body?.ID ?? 0) || 0,
      roleName: String(body?.role_name ?? body?.roleName ?? ''),
      roleKey: String(body?.role_key ?? body?.roleKey ?? ''),
      roleSort: Number(body?.role_sort ?? body?.roleSort ?? 0) || 0,
      roleStatus: String(body?.role_status ?? body?.statusFlag ?? '0'),
      roleDataScope: String(body?.role_data_scope ?? body?.dataScope ?? '5'),
      roleMenuCheckStrictly: String(
        body?.role_menu_check_strictly ?? body?.menuCheckStrictly ?? '1'
      ),
      roleDeptCheckStrictly: String(
        body?.role_dept_check_strictly ?? body?.deptCheckStrictly ?? '1'
      ),
      remark: String(body?.remark ?? ''),
      menuIds: body?.menu_ids ?? body?.menuIds ?? [],
      deptIds: body?.dept_ids ?? body?.deptIds ?? [],
    };
  }
}