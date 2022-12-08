import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysRole } from '../../../framework/core/model/SysRole';
import { ContextService } from '../../../framework/service/ContextService';
import { TokenService } from '../../../framework/service/TokenService';

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

  // @Log(title = "角色管理", businessType = BusinessType.EXPORT)
  // @PreAuthorize("@ss.hasPermi('system:role:export')")
  // @PostMapping("/export")
  // public void export(HttpServletResponse response, SysRole role)
  // {
  //     List<SysRole> list = roleService.selectRoleList(role);
  //     ExcelUtil<SysRole> util = new ExcelUtil<SysRole>(SysRole.class);
  //     util.exportExcel(response, list, "角色数据");
  // }

  /**
   * 角色信息详情
   */
  @Get('/:roleId')
  @PreAuthorize({ hasPermissions: ['system:role:query'] })
  async getInfo(@Param('roleId') roleId: string): Promise<Result> {
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (role) {
      return Result.okData(role);
    }
    return Result.err();
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
        `新增角色【${sysRole.roleName}】失败，角色名称已存在`
      );
    }
    const uniqueRoleKey = await this.sysRoleService.checkUniqueRoleKey(sysRole);
    if (!uniqueRoleKey) {
      return Result.errMsg(
        `新增角色【${sysRole.roleName}】失败，角色权限已存在`
      );
    }

    sysRole.createBy = this.contextService.getUsername();
    const id = await this.sysRoleService.insertRole(sysRole);
    return Result[id ? 'ok' : 'err']();
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
        `修改角色【${sysRole.roleName}】失败，角色名称已存在`
      );
    }
    const uniqueRoleKey = await this.sysRoleService.checkUniqueRoleKey(sysRole);
    if (!uniqueRoleKey) {
      return Result.errMsg(
        `修改角色【${sysRole.roleName}】失败，角色权限已存在`
      );
    }

    sysRole.updateBy = this.contextService.getUsername();
    const rows = await this.sysRoleService.updateRole(sysRole);
    if (rows > 0) {
      // 更新缓存用户权限
      // 非超级管理员用户 同时 自己也拥有角色权限
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
    return Result.errMsg(`修改角色【${sysRole.roleName}】失败，请联系管理员`);
  }

  /**
   * 角色信息删除
   */
  @Del('/:roleIds')
  @PreAuthorize({ hasPermissions: ['system:user:remove'] })
  async remove(@Param('roleIds') roleIds: string): Promise<Result> {
    if (!roleIds) return Result.err();
    // 处理字符转id数组
    const ids = roleIds.split(',');
    const rowNum = await this.sysRoleService.deleteRoleByIds(ids);
    return Result[rowNum ? 'ok' : 'err']();
  }
}
