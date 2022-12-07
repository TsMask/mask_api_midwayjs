import { Body, Controller, Del, Get, Inject, Param, Post, Put, Query } from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SysDept } from '../../../framework/core/model/SysDept';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysRole } from '../../../framework/core/model/SysRole';
import { ContextService } from '../../../framework/service/ContextService';
import { SysUser } from '../../../framework/core/model/SysUser';
import { bcryptHash } from '../../../common/utils/CryptoUtils';

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
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysDeptService: SysDeptServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  /**
  * 获取角色列表
  */
  @Get("/list")
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
 * 根据角色编号获取详细信息
 */
  @Get("/:roleId")
  @PreAuthorize({ hasPermissions: ['system:role:query'] })
  async getInfo(@Param("roleId") roleId: string): Promise<Result> {
    const role = await this.sysRoleService.selectRoleById(roleId);
    if (role) {
      return Result.okData(role);
    }
    return Result.err();
  }

  /**
  * 新增角色
  */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:role:add'] })
  async add(@Body() sysRole: SysRole): Promise<Result> {
    // 判断属性值是否唯一
    const uniqueRoleName = await this.sysRoleService.checkUniqueRoleName(sysRole);
    if (!uniqueRoleName) {
      return Result.errMsg(`新增角色【${sysRole.roleName}】失败，角色名称已存在`);
    }
    const uniqueRoleKey = await this.sysRoleService.checkUniqueRoleKey(sysRole);
    if (!uniqueRoleKey) {
      return Result.errMsg(`新增角色【${sysRole.roleName}】失败，角色权限已存在`);
    }

    sysRole.createBy = this.contextService.getUsername();
    const id = await this.sysRoleService.insertRole(sysRole);
    return Result[id ? 'ok' : 'err']();
  }

  /**
  * 修改用户
  */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  async edit(@Body() sysUser: SysUser): Promise<Result> {
    // 修改的用户ID是否可用
    const userId: string = sysUser.userId;
    if (!userId) return Result.err();
    // 检查是否管理员用户
    if (this.contextService.isSuperAdmin(userId)) {
      return Result.errMsg('不允许操作超级管理员用户');
    }
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    // 判断属性值是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(sysUser);
    if (!uniqueUserName) {
      return Result.errMsg(`修改用户【${user.userName}】失败，登录账号已存在`);
    }
    const uniquePhone = await this.sysUserService.checkUniquePhone(sysUser);
    if (!uniquePhone) {
      return Result.errMsg(`修改用户【${user.userName}】失败，手机号码已存在`);
    }
    const uniqueEmail = await this.sysUserService.checkUniqueEmail(sysUser);
    if (!uniqueEmail) {
      return Result.errMsg(`修改用户【${user.userName}】失败，邮箱账号已存在`);
    }

    sysUser.updateBy = this.contextService.getUsername();
    const id = await this.sysUserService.updateUser(sysUser);
    return Result[id ? 'ok' : 'err']();
  }

  /**
* 删除用户
*/
  @Del("/:userIds")
  @PreAuthorize({ hasPermissions: ['system:user:remove'] })
  async remove(@Param("userIds") userIds: string): Promise<Result> {
    if (!userIds) return Result.err();
    // 处理字符转id数组
    const ids = userIds.split(',');
    if (ids.includes(this.contextService.getUserId())) {
      return Result.errMsg("当前用户不能删除");
    }
    const rowNum = await this.sysUserService.deleteUserByIds(ids);
    return Result[rowNum ? 'ok' : 'err']();
  }

  /**
   * 重置密码
   */
  @Put("/resetPwd")
  @PreAuthorize({ hasPermissions: ['system:user:resetPwd'] })
  async resetPwd(@Body() sysUser: SysUser): Promise<Result> {
    // 修改的用户ID是否可用
    const userId: string = sysUser.userId;
    if (!userId) return Result.err();
    // 检查是否管理员用户
    if (this.contextService.isSuperAdmin(userId)) {
      return Result.errMsg('不允许操作超级管理员用户');
    }
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    sysUser.password = await bcryptHash(sysUser.password);
    sysUser.updateBy = this.contextService.getUsername();
    const id = await this.sysUserService.resetPwd(sysUser);
    return Result[id ? 'ok' : 'err']();
  }

  /**
* 用户授权角色信息
*/
  @Get("/authRole/:userId")
  @PreAuthorize({ hasPermissions: ['system:user:query'] })
  async authRoleInfo(@Param("userId") userId: string): Promise<Result> {
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    // 不是系统指定超级管理员需要排除其角色
    let roles = await this.sysRoleService.selectRolesByUserId(userId);
    if (!this.contextService.isSuperAdmin(userId)) {
      roles = roles.filter(r => r.roleId !== "1");
    }
    return Result.ok({
      user,
      roles
    })
  }


  /**
* 用户授权角色修改
*/
  @Put("/authRole")
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  async authRoleAdd(@Body("userId") userId: string, @Body("roleIds") roleIds: string[]): Promise<Result> {
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    const ok = await this.sysUserService.insertAserAuth(userId, roleIds);
    return Result[ok ? 'ok' : 'err']();
  }

  /**
   * 获取部门树列表
   */
  @PreAuthorize({ hasPermissions: ['system:user:list'] })
  @Get("/deptTree")
  async deptTree(@Query() sysDept: SysDept): Promise<Result> {
    const data = await this.sysDeptService.selectDeptTreeList(sysDept);
    return Result.okData(data);
  }
}
