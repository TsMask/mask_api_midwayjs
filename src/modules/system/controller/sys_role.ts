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
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import {
  loginUser,
  loginUserToDataScopeSQL,
  loginUserToUserName,
} from '../../../framework/reqctx/auth';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { SYS_ROLE_SYSTEM_ID } from '../../../framework/constants/system';
import { Resp } from '../../../framework/resp/api';
import { SysRoleService } from '../service/sys_role';
import { SysUserService } from '../service/sys_user';
import { SysRole } from '../model/sys_role';

/**角色信息 控制层处理 */
@Controller('/system/role')
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
    return Resp.okData({ rows, total });
  }

  /**角色信息详情 */
  @Get('/:roleId', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:role:query'] })],
  })
  public async info(
    @Valid(RuleType.number()) @Param('roleId') roleId: number
  ): Promise<Resp> {
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: roleId is empty');
    }
    const data = await this.sysRoleService.findById(roleId);
    if (data.roleId === roleId) {
      return Resp.okData(data);
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
    if (body.roleId > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: roleId not is empty');
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
      return Resp.errMsg(`角色新增【${body.roleName}】失败，角色键值已存在`);
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
    if (body.roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: roleId is empty');
    }

    // 检查是否系统管理员角色
    if (body.roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作系统管理员角色');
    }

    // 检查是否分配给当前用户
    const [info, err] = loginUser(this.c);
    if (err) {
      this.c.status = 401;
      return Resp.codeMsg(401002, err);
    }
    if (Array.isArray(info.user.roleIds) && info.user.roleIds.length > 0) {
      if (info.user.roleIds.includes(body.roleId)) {
        return Resp.errMsg('不允许操作分配给自己的角色');
      }
    }

    // 判断角色名称是否唯一
    const uniqueName = await this.sysRoleService.checkUniqueByName(
      body.roleName,
      body.roleId
    );
    if (!uniqueName) {
      return Resp.errMsg(`角色修改【${body.roleName}】失败，角色名称已存在`);
    }

    // 判断角色键值是否唯一
    const uniqueKey = await this.sysRoleService.checkUniqueByKey(
      body.roleKey,
      body.roleId
    );
    if (!uniqueKey) {
      return Resp.errMsg(`角色修改【${body.roleName}】失败，角色键值已存在`);
    }

    // 检查是否存在
    const roleInfo = await this.sysRoleService.findById(body.roleId);
    if (roleInfo.roleId !== body.roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    roleInfo.roleName = body.roleName;
    roleInfo.roleKey = body.roleKey;
    roleInfo.roleSort = body.roleSort;
    roleInfo.dataScope = body.dataScope;
    roleInfo.menuCheckStrictly = body.menuCheckStrictly;
    roleInfo.deptCheckStrictly = body.deptCheckStrictly;
    roleInfo.statusFlag = body.statusFlag;
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
  @Del('/:roleId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:role:remove'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.string().allow('')) @Param('roleId') roleId: string
  ): Promise<Resp> {
    if (roleId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: roleId is empty');
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
      AuthorizeUserMiddleware({ hasPerms: ['system:role:edit'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async status(
    @Valid(RuleType.number().required()) @Body('roleId') roleId: number,
    @Valid(RuleType.string().required()) @Body('statusFlag') statusFlag: string
  ): Promise<Resp> {
    // 检查是否管理员角色
    if (roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作管理员角色');
    }

    // 检查是否存在
    const role = await this.sysRoleService.findById(roleId);
    if (role.roleId !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    // 与旧值相等不变更
    if (role.statusFlag === statusFlag) {
      return Resp.errMsg('变更状态与旧值相等！');
    }

    // 更新状态不刷新缓存
    role.statusFlag = statusFlag;
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
      AuthorizeUserMiddleware({ hasPerms: ['system:role:edit'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async dataScope(
    @Valid(RuleType.number().required()) @Body('roleId') roleId: number,
    @Valid(RuleType.array<number>()) @Body('deptIds') deptIds: number[],
    @Valid(
      RuleType.string()
        .pattern(/^[12345]$/)
        .required()
    )
    @Body('dataScope')
    dataScope: string,
    @Valid(
      RuleType.string()
        .pattern(/^[01]$/)
        .required()
    )
    @Body('deptCheckStrictly')
    deptCheckStrictly: string
  ): Promise<Resp> {
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: roleId is empty');
    }
    // 检查是否系统管理员角色
    if (roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作系统管理员角色');
    }
    // 检查是否存在
    const roleInfo = await this.sysRoleService.findById(roleId);
    if (roleInfo.roleId !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }
    // 更新数据权限
    roleInfo.deptIds = deptIds;
    roleInfo.dataScope = dataScope;
    roleInfo.deptCheckStrictly = deptCheckStrictly;
    roleInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysRoleService.updateAndDataScope(roleInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**角色分配用户列表 */
  @Get('/user/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:role:list'] })],
  })
  public async userAuthList(
    @Query() query: Record<string, string>
  ): Promise<Resp> {
    const roleId = parseNumber(query.roleId);
    if (roleId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: roleId is empty');
    }

    // 检查是否存在
    const role = await this.sysRoleService.findById(roleId);
    if (role.roleId !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    const dataScopeSQL = loginUserToDataScopeSQL(
      this.c,
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysUserService.findAuthUsersPage(
      query,
      dataScopeSQL
    );
    return Resp.okData({ rows, total });
  }

  /**角色分配选择授权 */
  @Put('/user/auth', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:role:edit'] }),
      OperateLogMiddleware({
        title: '角色信息',
        businessType: BUSINESS_TYPE.GRANT,
      }),
    ],
  })
  public async userAuthChecked(
    @Valid(RuleType.number().required()) @Body('roleId') roleId: number,
    @Valid(RuleType.array<number>().required())
    @Body('userIds')
    userIds: number[],
    @Valid(RuleType.boolean().required()) @Body('auth') auth: boolean
  ): Promise<Resp> {
    if (userIds.length <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: userIds is empty');
    }

    // 检查是否存在
    const role = await this.sysRoleService.findById(roleId);
    if (role.roleId !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    let rows = 0;
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
    const fileName = `role_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysRoleService.exportData(rows, fileName);
  }
}
