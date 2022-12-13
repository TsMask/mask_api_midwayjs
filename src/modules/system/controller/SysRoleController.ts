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
import { Result } from '../../../framework/core/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysRole } from '../../../framework/core/model/SysRole';
import { ContextService } from '../../../framework/service/ContextService';
import { TokenService } from '../../../framework/service/TokenService';
import { parseNumber } from '../../../common/utils/ValueParseUtils';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';
import { SysDept } from '../../../framework/core/model/SysDept';

/**
 * 角色信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/role')
export class SysRoleController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private tokenService: TokenService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  @Inject()
  private sysDeptService: SysDeptServiceImpl;

  /**
   * 角色列表列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:role:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysRoleService.selectRolePage(query);
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

    sysRole.createBy = this.contextService.getUsername();
    const insertId = await this.sysRoleService.insertRole(sysRole);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 角色信息修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  async edit(@Body() sysRole: SysRole): Promise<Result> {
    // 修改的角色ID是否可用
    const roleId = sysRole.roleId;
    if (!roleId) return Result.err();
    // 检查是否管理员角色
    if (roleId === '1') {
      return Result.errMsg('不允许操作超级管理员角色');
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

    sysRole.updateBy = this.contextService.getUsername();
    const rows = await this.sysRoleService.updateRole(sysRole);
    if (rows > 0) {
      // 更新缓存用户权限
      // 非超级管理员用户 同时 自己拥有角色权限
      const loginUser = this.contextService.getLoginUser();
      const isSuperAdmin = this.contextService.isSuperAdmin(loginUser.userId);
      if (!isSuperAdmin && loginUser.user.roleIds.includes(sysRole.roleId)) {
        const user = await this.sysUserService.selectUserByUserName(
          loginUser.user.userName
        );
        loginUser.user = user;
        this.tokenService.setLoginUser(loginUser);
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
  async remove(@Param('roleIds') roleIds: string): Promise<Result> {
    if (!roleIds) return Result.err();
    // 处理字符转id数组
    const ids = roleIds.split(',');
    const rows = await this.sysRoleService.deleteRoleByIds(ids);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色状态变更
   */
  @Put('/changeStatus')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  async changeStatus(
    @Body('roleId') roleId: string,
    @Body('status') status: string
  ): Promise<Result> {
    if (!roleId) return Result.err();
    // 检查是否管理员角色
    if (roleId === '1') {
      return Result.errMsg('不允许操作超级管理员角色');
    }
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (!role) {
      return Result.errMsg('没有权限访问角色数据！');
    }
    // 更新状态不刷新缓存
    const sysRole = new SysRole();
    sysRole.roleId = roleId;
    sysRole.status = `${parseNumber(status)}`;
    sysRole.updateBy = this.contextService.getUsername();
    const rowNum = await this.sysRoleService.updateRole(sysRole);
    return Result[rowNum ? 'ok' : 'err']();
  }

  /**
   * 角色数据权限修改
   */
  @Put('/dataScope')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
  async dataScope(@Body() sysRole: SysRole): Promise<Result> {
    const roleId = sysRole.roleId;
    if (!roleId) return Result.err();
    // 检查是否管理员角色
    if (roleId === '1') {
      return Result.errMsg('不允许操作超级管理员角色');
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
    return Result.ok({
      checkedKeys: await this.sysDeptService.selectDeptListByRoleId(roleId),
      depts: await this.sysDeptService.selectDeptTreeList(new SysDept()),
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
    const data = await this.sysUserService.selectAllocatedPage(
      roleId,
      false,
      query
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
    const data = await this.sysUserService.selectAllocatedPage(
      roleId,
      true,
      query
    );
    return Result.ok(data);
  }

  /**
   * 角色批量选择用户授权
   */
  @Put('/authUser/selectAll')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
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
    const rows = await this.sysRoleService.insertAuthUsers(roleId, ids);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色批量选择用户取消授权
   */
  @Put('/authUser/cancelAll')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
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
    const rows = await this.sysRoleService.deleteAuthUsers(roleId, ids);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 角色选择用户取消授权
   */
  @Put('/authUser/cancel')
  @PreAuthorize({ hasPermissions: ['system:role:edit'] })
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
