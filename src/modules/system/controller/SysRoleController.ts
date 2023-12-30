import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@midwayjs/core';
import { Result } from '../../../framework/vo/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { OperateLog } from '../../../framework/decorator/OperateLogMethodDecorator';
import { ROLE_DATA_SCOPE } from '../../../framework/enums/RoleDataScopeEnum';
import { FileService } from '../../../framework/service/FileService';
import { ADMIN_ROLE_ID } from '../../../framework/constants/AdminConstants';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { SysRole } from '../model/SysRole';

/**
 * 角色信息
 *
 * @author TsMask
 */
@Controller('/system/role')
export class SysRoleController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  /**
   * 角色列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:role:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const data = await this.sysRoleService.selectRolePage(query, dataScopeSQL);
    return Result.ok(data);
  }

  /**
   * 角色信息详情
   */
  @Get('/:roleId')
  @PreAuthorize({ hasPermissions: ['system:role:query'] })
  async getInfo(@Param('roleId') roleId: string): Promise<Result> {
    if (!roleId) return Result.err();
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) return Result.err();
    return Result.okData(role);
  }

  /**
   * 角色信息新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:role:add'] })
  @OperateLog({
    title: '角色信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() sysRole: SysRole): Promise<Result> {
    const { roleName, roleKey } = sysRole;
    if (!roleName || !roleKey) return Result.err();

    // 判断角色名称是否唯一
    const uniqueRoleName = await this.sysRoleService.checkUniqueRoleName(
      roleName
    );
    if (!uniqueRoleName) {
      return Result.errMsg(`角色新增【${roleName}】失败，角色名称已存在`);
    }

    // 判断角色键值是否唯一
    const uniqueRoleKey = await this.sysRoleService.checkUniqueRoleKey(roleKey);
    if (!uniqueRoleKey) {
      return Result.errMsg(`角色新增【${roleName}】失败，角色键值已存在`);
    }

    sysRole.createBy = this.contextService.getUseName();
    const insertId = await this.sysRoleService.insertRole(sysRole);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 角色信息修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() sysRole: SysRole): Promise<Result> {
    const { roleId, roleName, roleKey } = sysRole;
    if (!roleId || !roleName || !roleKey) return Result.err();

    // 检查是否管理员角色
    if (roleId === ADMIN_ROLE_ID) {
      return Result.errMsg('不允许操作管理员角色');
    }

    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }

    // 判断角色名称是否唯一
    const uniqueRoleName = await this.sysRoleService.checkUniqueRoleName(
      roleName,
      roleId
    );
    if (!uniqueRoleName) {
      return Result.errMsg(`角色修改【${roleName}】失败，角色名称已存在`);
    }

    // 判断角色键值是否唯一
    const uniqueRoleKey = await this.sysRoleService.checkUniqueRoleKey(
      roleKey,
      roleId
    );
    if (!uniqueRoleKey) {
      return Result.errMsg(`角色修改【${roleName}】失败，角色键值已存在`);
    }

    sysRole.updateBy = this.contextService.getUseName();
    const rows = await this.sysRoleService.updateRole(sysRole);
    if (rows > 0) {
      return Result.ok();
    }
    return Result.errMsg(`角色修改【${roleName}】失败`);
  }

  /**
   * 角色信息删除
   */
  @Del('/:roleIds')
  @PreAuthorize({ hasPermissions: ['system:role:remove'] })
  @OperateLog({
    title: '角色信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('roleIds') roleIds: string): Promise<Result> {
    if (!roleIds) return Result.err();
    // 处理字符转id数组
    const ids = roleIds.split(',');
    if (ids.length <= 0) return Result.err();
    const uniqueIDs = [...new Set(ids)];
    // 检查是否管理员角色
    for (const id of uniqueIDs) {
      if (id === ADMIN_ROLE_ID) {
        return Result.errMsg('不允许操作管理员角色');
      }
    }
    const rows = await this.sysRoleService.deleteRoleByIds(uniqueIDs);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色状态变更
   */
  @Put('/changeStatus')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async changeStatus(
    @Body('roleId') roleId: string,
    @Body('status') status: string
  ): Promise<Result> {
    if (!roleId || !status || status.length > 1) return Result.err();

    // 检查是否管理员角色
    if (roleId === ADMIN_ROLE_ID) {
      return Result.errMsg('不允许操作管理员角色');
    }

    // 检查是否存在
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }

    // 与旧值相等不变更
    if (role.status === status) {
      return Result.errMsg('变更状态与旧值相等！');
    }

    // 更新状态不刷新缓存
    const sysRole = new SysRole();
    sysRole.roleId = roleId;
    sysRole.status = status;
    sysRole.updateBy = this.contextService.getUseName();
    const rowNum = await this.sysRoleService.updateRole(sysRole);
    return Result[rowNum ? 'ok' : 'err']();
  }

  /**
   * 角色数据权限修改
   */
  @Put('/dataScope')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async dataScope(@Body() sysRole: SysRole): Promise<Result> {
    const roleId = sysRole.roleId;
    if (!roleId) return Result.err();
    // 检查是否管理员角色
    if (roleId === ADMIN_ROLE_ID) {
      return Result.errMsg('不允许操作管理员角色');
    }
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }
    const newSysRole = new SysRole();
    newSysRole.roleId = roleId;
    newSysRole.deptIds = sysRole.deptIds;
    newSysRole.dataScope = sysRole.dataScope;
    newSysRole.deptCheckStrictly = sysRole.deptCheckStrictly;
    const rows = await this.sysRoleService.authDataScope(newSysRole);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色分配用户列表
   */
  @Get('/authUser/allocatedList')
  @PreAuthorize({ hasPermissions: ['system:role:list'] })
  async authUserAllocatedList(): Promise<Result> {
    const { query } = this.contextService.getContext();
    const roleId = query.roleId as string;
    if (!roleId) return Result.err();
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }
    const dataScopeSQL = this.contextService.getDataScopeSQL('d', 'u');
    const data = await this.sysUserService.selectAllocatedPage(
      query,
      dataScopeSQL
    );
    return Result.ok(data);
  }

  /**
   * 角色分配选择授权
   *
   * @param roleId 分配的角色
   * @param userIds 选择用户ID
   * @param checked 选择操作 添加true 取消false
   */
  @Put('/authUser/checked')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperateLog({
    title: '角色信息',
    businessType: OperatorBusinessTypeEnum.GRANT,
  })
  async authUserChecked(
    @Body('roleId') roleId: string,
    @Body('userIds') userIds: string,
    @Body('checked') checked: boolean
  ): Promise<Result> {
    if (!roleId || !userIds) return Result.err();
    // 处理字符转id数组
    const ids = userIds.split(',');
    if (ids.length <= 0) return Result.err();
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }
    let rows = 0;
    if (checked) {
      rows = await this.sysRoleService.insertAuthUsers(roleId, [
        ...new Set(ids),
      ]);
    } else {
      rows = await this.sysRoleService.deleteAuthUsers(roleId, [
        ...new Set(ids),
      ]);
    }
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 导出角色信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:role:export'] })
  @OperateLog({
    title: '角色信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysRoleService.selectRolePage(query, dataScopeSQL);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysRole) => {
        pre.push({
          角色序号: cur.roleId,
          角色名称: cur.roleName,
          角色权限: cur.roleKey,
          角色排序: `${cur.roleSort}`,
          数据范围: ROLE_DATA_SCOPE[cur.dataScope],
          角色状态: ['停用', '正常'][+cur.status],
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `role_export_${rows.length}_${Date.now()}.xlsx`;
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
}
