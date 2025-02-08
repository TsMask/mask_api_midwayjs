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

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/reqctx/context';
import { SYS_ROLE_SYSTEM_ID } from '../../../framework/constants/system';
import { SysRoleService } from '../service/sys_role';
import { SysUserService } from '../service/sys_user';
import { SysRole } from '../model/sys_role';

/**角色信息 控制层处理 */
@Controller('/system/role')
export class SysRoleController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysUserService: SysUserService;

  @Inject()
  private sysRoleService: SysRoleService;

  /**
   * 角色列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:role:list'] })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysRoleService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 角色信息详情
   */
  @Get('/:roleId')
  @PreAuthorize({ hasPermissions: ['system:role:query'] })
  public async info(
    @Valid(RuleType.number().required()) @Param('roleId') roleId: number
  ): Promise<Resp> {
    if (roleId <= 0) {
      return Resp.codeMsg(40010, 'bind err: roleId is empty');
    }
    const data = await this.sysRoleService.findById(roleId);
    if (data.roleId === roleId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**
   * 角色信息新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:role:add'] })
  @OperateLog({
    title: '角色信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  public async add(@Body() body: SysRole): Promise<Resp> {
    if (body.roleId > 0) {
      return Resp.codeMsg(40010, 'bind err: roleId not is empty');
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

    body.createBy = this.contextService.getUseName();
    const insertId = await this.sysRoleService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**
   * 角色信息修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async edit(@Body() body: SysRole): Promise<Resp> {
    if (body.roleId <= 0) {
      return Resp.codeMsg(40010, 'bind err: roleId is empty');
    }

    // 检查是否系统管理员角色
    if (body.roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作系统管理员角色');
    }

    // 检查是否存在
    const roleInfo = await this.sysRoleService.findById(body.roleId);
    if (roleInfo.roleId !== body.roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
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

    roleInfo.roleName = body.roleName;
    roleInfo.roleKey = body.roleKey;
    roleInfo.roleSort = body.roleSort;
    roleInfo.dataScope = body.dataScope;
    roleInfo.menuCheckStrictly = body.menuCheckStrictly;
    roleInfo.deptCheckStrictly = body.deptCheckStrictly;
    roleInfo.statusFlag = body.statusFlag;
    roleInfo.updateBy = this.contextService.getUseName();
    roleInfo.menuIds = body.menuIds;
    roleInfo.deptIds = body.deptIds;
    const rows = await this.sysRoleService.update(roleInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 角色信息删除
   */
  @Del('/:roleId')
  @PreAuthorize({ hasPermissions: ['system:role:remove'] })
  @OperateLog({
    title: '角色信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  public async remove(
    @Valid(RuleType.string().required()) @Param('roleId') roleId: string
  ): Promise<Resp> {
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
    const rows = await this.sysRoleService.deleteByIds(ids);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }

  /**
   * 角色状态变更
   */
  @Put('/status')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async status(
    @Valid(RuleType.number().required()) @Body('roleId') roleId: number,
    @Valid(RuleType.string().required()) @Body('status') status: string
  ): Promise<Resp> {
    // 检查是否管理员角色
    if (roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作管理员角色');
    }

    // 检查是否存在
    const role = await this.sysRoleService.findById(roleId);
    if (!role) {
      return Resp.errMsg('没有权限访问角色数据！');
    }

    // 与旧值相等不变更
    if (role.statusFlag === status) {
      return Resp.errMsg('变更状态与旧值相等！');
    }

    // 更新状态不刷新缓存
    role.statusFlag = status;
    role.updateBy = this.contextService.getUseName();
    const rows = await this.sysRoleService.update(role);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 角色数据权限修改
   */
  @Put('/data-scope')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async dataScope(@Body() body: SysRole): Promise<Resp> {
    if (body.roleId <= 0) {
      return Resp.codeMsg(40010, 'bind err: roleId is empty');
    }
    // 检查是否系统管理员角色
    if (body.roleId === SYS_ROLE_SYSTEM_ID) {
      return Resp.errMsg('不允许操作系统管理员角色');
    }
    // 检查是否存在
    const roleInfo = await this.sysRoleService.findById(body.roleId);
    if (!roleInfo) {
      return Resp.errMsg('没有权限访问角色数据！');
    }
    // 更新数据权限
    roleInfo.deptIds = body.deptIds;
    roleInfo.dataScope = body.dataScope;
    roleInfo.deptCheckStrictly = body.deptCheckStrictly;
    roleInfo.updateBy = this.contextService.getUseName();
    const rows = await this.sysRoleService.updateAndDataScope(roleInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 角色分配用户列表
   */
  @Get('/user/list')
  @PreAuthorize({ hasPermissions: ['system:role:list'] })
  public async userAuthList(
    @Query() query: Record<string, string>
  ): Promise<Resp> {
    const roleId = parseNumber(query.roleId);
    if (roleId <= 0) {
      return Resp.codeMsg(40010, 'bind err: roleId is empty');
    }
    const role = await this.sysRoleService.findById(roleId);
    if (role.roleId !== roleId) {
      return Resp.errMsg('没有权限访问角色数据！');
    }
    const dataScopeSQL = this.contextService.getDataScopeSQL(
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysUserService.findAuthUsersPage(
      query,
      dataScopeSQL
    );
    return Resp.okData({ rows, total });
  }

  /**
   * 角色分配选择授权
   *
   * @param roleId 分配的角色
   * @param userIds 选择用户ID
   * @param checked 选择操作 添加true 取消false
   */
  @Put('/user/auth')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: BUSINESS_TYPE.GRANT,
  })
  public async userAuthChecked(
    @Valid(RuleType.number().required()) @Body('roleId') roleId: number,
    @Valid(RuleType.array().required()) @Body('userIds') userIds: number[],
    @Valid(RuleType.boolean().required()) @Body('auth') auth: boolean
  ): Promise<Resp> {
    if (userIds.length <= 0) {
      return Resp.codeMsg(40010, 'bind err: userIds is empty');
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

  /**
   * 导出角色信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:role:export'] })
  @OperateLog({
    title: '角色信息',
    businessType: BUSINESS_TYPE.EXPORT,
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysRoleService.findByPage(query);
    if (total === 0) {
      return Resp.codeMsg(40016, 'export data record as empty');
    }

    // 导出文件名称
    const fileName = `role_export_${rows.length}_${Date.now()}.xlsx`;
    const ctx = this.contextService.getContext();
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysRoleService.exportData(rows, fileName);
  }
}
