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
} from '@midwayjs/decorator';
import { Result } from '../../../framework/model/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import { TokenService } from '../../../framework/service/TokenService';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';
import { SysDept } from '../model/SysDept';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { ROLE_DATA_SCOPE } from '../../../framework/enums/RoleDataScopeEnum';
import { FileService } from '../../../framework/service/FileService';
import { ADMIN_ROLE_ID } from '../../../framework/constants/AdminConstants';
import { SysRole } from '../model/SysRole';
import { STATUS_YES } from '../../../framework/constants/CommonConstants';

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
  private tokenService: TokenService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  @Inject()
  private sysDeptService: SysDeptServiceImpl;

  /**
   * 导出角色信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:role:export'] })
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.EXPORT })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    query.pageNum = 1;
    query.pageSize = 1000;
    const data = await this.sysRoleService.selectRolePage(query, dataScopeSQL);
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysRole) => {
        pre.push({
          角色序号: cur.roleId,
          角色名称: cur.roleName,
          角色权限: cur.roleKey,
          角色排序: `${cur.roleSort}`,
          数据范围: ROLE_DATA_SCOPE[cur.dataScope],
          角色状态: cur.status === STATUS_YES ? '正常' : '停用',
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
    return await this.fileService.writeExcelFile(rows, '角色信息', fileName);
  }

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
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.INSERT })
  async add(@Body() sysRole: SysRole): Promise<Result> {
    // 判断属性值是否唯一
    const uniqueRoleName = await this.sysRoleService.checkUniqueRoleName(
      sysRole
    );
    if (!uniqueRoleName) {
      return Result.errMsg(
        `角色新增【${sysRole.roleName}】失败，角色名称已存在`
      );
    }
    const uniqueRoleKey = await this.sysRoleService.checkUniqueRoleKey(sysRole);
    if (!uniqueRoleKey) {
      return Result.errMsg(
        `角色新增【${sysRole.roleName}】失败，权限字符已存在`
      );
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
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async edit(@Body() sysRole: SysRole): Promise<Result> {
    // 修改的角色ID是否可用
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
    // 判断属性值是否唯一
    const uniqueRoleName = await this.sysRoleService.checkUniqueRoleName(
      sysRole
    );
    if (!uniqueRoleName) {
      return Result.errMsg(
        `角色修改【${sysRole.roleName}】失败，角色名称已存在`
      );
    }
    const uniqueRoleKey = await this.sysRoleService.checkUniqueRoleKey(sysRole);
    if (!uniqueRoleKey) {
      return Result.errMsg(
        `修改角色【${sysRole.roleName}】失败，权限字符已存在`
      );
    }

    sysRole.updateBy = this.contextService.getUseName();
    const rows = await this.sysRoleService.updateRole(sysRole);
    if (rows > 0) {
      // 更新缓存用户权限
      // 非管理员用户 同时 自己拥有角色权限
      const loginUser = this.contextService.getLoginUser();
      const isAdmin = this.contextService.isAdmin(loginUser.userId);
      if (!isAdmin && loginUser.user.roleIds.includes(sysRole.roleId)) {
        const user = await this.sysUserService.selectUserByUserName(
          loginUser.user.userName
        );
        loginUser.user = user;
        await this.tokenService.setLoginUser(loginUser, isAdmin);
      }
      return Result.ok();
    }
    return Result.errMsg(`角色修改【${sysRole.roleName}】失败，请联系管理员`);
  }

  /**
   * 角色信息删除
   */
  @Del('/:roleIds')
  @PreAuthorize({ hasPermissions: ['system:role:remove'] })
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.DELETE })
  async remove(@Param('roleIds') roleIds: string): Promise<Result> {
    if (!roleIds) return Result.err();
    // 处理字符转id数组
    const ids = roleIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysRoleService.deleteRoleByIds([...new Set(ids)]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色状态变更
   */
  @Put('/changeStatus')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.UPDATE })
  async changeStatus(
    @Body('roleId') roleId: string,
    @Body('status') status: string
  ): Promise<Result> {
    if (!roleId) return Result.err();
    // 检查是否管理员角色
    if (roleId === ADMIN_ROLE_ID) {
      return Result.errMsg('不允许操作管理员角色');
    }
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
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
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.UPDATE })
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
    const rows = await this.sysRoleService.authDataScope(sysRole);
    return Result[rows >= 0 ? 'ok' : 'err']();
  }

  /**
   * 角色部门树列表
   */
  @Get('/deptTree/:roleId')
  @PreAuthorize({ hasPermissions: ['system:role:query'] })
  async deptTree(@Param('roleId') roleId: string): Promise<Result> {
    if (!roleId) return Result.err();
    const dataScopeSQL = this.contextService.getDataScopeSQL('d');
    const deptTrees = await this.sysDeptService.selectDeptTreeList(
      new SysDept(),
      dataScopeSQL
    );
    return Result.ok({
      checkedKeys: await this.sysDeptService.selectDeptListByRoleId(roleId),
      depts: deptTrees,
    });
  }

  /**
   * 角色已分配用户列表
   */
  @Get('/authUser/allocatedList')
  @PreAuthorize({ hasPermissions: ['system:role:list'] })
  async allocatedList(@Query('roleId') roleId: string): Promise<Result> {
    if (!roleId) return Result.err();
    const query = this.contextService.getContext().query;
    const dataScopeSQL = this.contextService.getDataScopeSQL('d', 'u');
    const data = await this.sysUserService.selectAllocatedPage(
      roleId,
      true,
      query,
      dataScopeSQL
    );
    return Result.ok(data);
  }

  /**
   * 角色未分配用户列表
   */
  @Get('/authUser/unallocatedList')
  @PreAuthorize({ hasPermissions: ['system:role:list'] })
  async unallocatedList(@Query('roleId') roleId: string): Promise<Result> {
    if (!roleId) return Result.err();
    const query = this.contextService.getContext().query;
    const dataScopeSQL = this.contextService.getDataScopeSQL('d', 'u');
    const data = await this.sysUserService.selectAllocatedPage(
      roleId,
      false,
      query,
      dataScopeSQL
    );
    return Result.ok(data);
  }

  /**
   * 角色批量选择用户授权
   */
  @Put('/authUser/selectAll')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.GRANT })
  async selectAuthUserAll(
    @Body('roleId') roleId: string,
    @Body('userIds') userIds: string
  ): Promise<Result> {
    if (!roleId || !userIds) return Result.err();
    // 处理字符转id数组
    const ids = userIds.split(',');
    if (ids.length <= 0) return Result.err();
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }
    const rows = await this.sysRoleService.insertAuthUsers(roleId, [
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色批量选择用户取消授权
   */
  @Put('/authUser/cancelAll')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.GRANT })
  async cancelAuthUserAll(
    @Body('roleId') roleId: string,
    @Body('userIds') userIds: string
  ): Promise<Result> {
    if (!roleId || !userIds) return Result.err();
    // 处理字符转id数组
    const ids = userIds.split(',');
    if (ids.length <= 0) return Result.err();
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }
    const rows = await this.sysRoleService.deleteAuthUsers(roleId, [
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色选择用户取消授权
   */
  @Put('/authUser/cancel')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  @OperLog({ title: '角色信息', businessType: OperatorBusinessTypeEnum.GRANT })
  async cancelAuthUser(
    @Body('roleId') roleId: string,
    @Body('userId') userId: string
  ): Promise<Result> {
    if (!roleId || !userId) return Result.err();
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }
    const rows = await this.sysRoleService.deleteAuthUsers(roleId, [userId]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
