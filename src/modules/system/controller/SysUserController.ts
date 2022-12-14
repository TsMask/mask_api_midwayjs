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
import { SysDept } from '../../../framework/core/model/SysDept';
import { SysDeptServiceImpl } from '../service/impl/SysDeptServiceImpl';
import { SysRoleServiceImpl } from '../service/impl/SysRoleServiceImpl';
import { SysPostServiceImpl } from '../service/impl/SysPostServiceImpl';
import { SysRole } from '../../../framework/core/model/SysRole';
import { SysPost } from '../model/SysPost';
import { ContextService } from '../../../framework/service/ContextService';
import { SysUser } from '../../../framework/core/model/SysUser';
import { parseNumber } from '../../../common/utils/ValueParseUtils';

/**
 * 用户信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/user')
export class SysUserController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Inject()
  private sysDeptService: SysDeptServiceImpl;

  @Inject()
  private sysRoleService: SysRoleServiceImpl;

  @Inject()
  private sysPostService: SysPostServiceImpl;

  /**
   * 用户列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:user:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysUserService.selectUserPage(query);
    return Result.ok(data);
  }

  /**
   * 用户信息
   */
  @Get('/')
  @Get('/:userId')
  @PreAuthorize({ hasPermissions: ['system:user:query'] })
  async getInfo(@Param('userId') userId: string): Promise<Result> {
    let roles = await this.sysRoleService.selectRoleList(new SysRole());
    const posts = await this.sysPostService.selectPostList(new SysPost());
    // 不是系统指定超级管理员需要排除其角色
    if (!this.contextService.isSuperAdmin(userId)) {
      roles = roles.filter(r => r.roleId !== '1');
    }
    // 检查用户是否存在
    const sysUser = await this.sysUserService.selectUserById(userId);
    if (sysUser && sysUser.userId) {
      const userRoleIds = sysUser.roles.map(r => r.roleId);
      const userPostIds = await this.sysPostService.selectPostListByUserId(
        sysUser.userId
      );
      delete sysUser.password;
      return Result.ok({
        data: sysUser,
        roleIds: userRoleIds,
        postIds: userPostIds,
        roles,
        posts,
      });
    }
    return Result.ok({
      roles,
      posts,
    });
  }

  /**
   * 用户信息新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:user:add'] })
  async add(@Body() sysUser: SysUser): Promise<Result> {
    // 判断属性值是否唯一
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(
      sysUser
    );
    if (!uniqueUserName) {
      return Result.errMsg(
        `新增用户【${sysUser.userName}】失败，登录账号已存在`
      );
    }
    const uniquePhone = await this.sysUserService.checkUniquePhone(sysUser);
    if (!uniquePhone) {
      return Result.errMsg(
        `新增用户【${sysUser.userName}】失败，手机号码已存在`
      );
    }
    const uniqueEmail = await this.sysUserService.checkUniqueEmail(sysUser);
    if (!uniqueEmail) {
      return Result.errMsg(
        `新增用户【${sysUser.userName}】失败，邮箱账号已存在`
      );
    }

    sysUser.createBy = this.contextService.getUsername();
    const insertId = await this.sysUserService.insertUser(sysUser);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 用户信息修改
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
    const uniqueUserName = await this.sysUserService.checkUniqueUserName(
      sysUser
    );
    if (!uniqueUserName) {
      return Result.errMsg(
        `修改用户【${sysUser.userName}】失败，登录账号已存在`
      );
    }
    const uniquePhone = await this.sysUserService.checkUniquePhone(sysUser);
    if (!uniquePhone) {
      return Result.errMsg(
        `修改用户【${sysUser.userName}】失败，手机号码已存在`
      );
    }
    const uniqueEmail = await this.sysUserService.checkUniqueEmail(sysUser);
    if (!uniqueEmail) {
      return Result.errMsg(
        `修改用户【${sysUser.userName}】失败，邮箱账号已存在`
      );
    }

    sysUser.updateBy = this.contextService.getUsername();
    const rows = await this.sysUserService.updateUser(sysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户信息删除
   */
  @Del('/:userIds')
  @PreAuthorize({ hasPermissions: ['system:user:remove'] })
  async remove(@Param('userIds') userIds: string): Promise<Result> {
    if (!userIds) return Result.err();
    // 处理字符转id数组
    const ids = userIds.split(',');
    if (ids.length <= 0) return Result.err();
    if (ids.includes(this.contextService.getUserId())) {
      return Result.errMsg('当前用户不能删除');
    }
    const rows = await this.sysUserService.deleteUserByIds([...new Set(ids)]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户重置密码
   */
  @Put('/resetPwd')
  @PreAuthorize({ hasPermissions: ['system:user:resetPwd'] })
  async resetPwd(
    @Body('userId') userId: string,
    @Body('password') password: string
  ): Promise<Result> {
    // 修改的用户ID和密码是否可用
    if (!userId || !password) return Result.err();
    // 检查是否管理员用户
    if (this.contextService.isSuperAdmin(userId)) {
      return Result.errMsg('不允许操作超级管理员用户');
    }
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    const sysUser = new SysUser();
    sysUser.userId = userId;
    sysUser.password = password;
    sysUser.updateBy = this.contextService.getUsername();
    const rows = await this.sysUserService.updateUser(sysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户状态修改
   */
  @Put('/changeStatus')
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  async changeStatus(
    @Body('userId') userId: string,
    @Body('status') status: string
  ): Promise<Result> {
    if (!userId) return Result.err();
    // 检查是否管理员用户
    if (this.contextService.isSuperAdmin(userId)) {
      return Result.errMsg('不允许操作超级管理员用户');
    }
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    const sysUser = new SysUser();
    sysUser.userId = userId;
    sysUser.status = `${parseNumber(status)}`;
    sysUser.updateBy = this.contextService.getUsername();
    const rows = await this.sysUserService.updateUser(sysUser);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 用户授权角色信息
   */
  @Get('/authRole/:userId')
  @PreAuthorize({ hasPermissions: ['system:user:query'] })
  async authRoleInfo(@Param('userId') userId: string): Promise<Result> {
    // 修改的用户ID是否可用
    if (!userId) return Result.err();
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    delete user.password;
    // 不是系统指定超级管理员需要排除其角色
    let roles = await this.sysRoleService.selectRolesByUserId(userId);
    if (!this.contextService.isSuperAdmin(userId)) {
      roles = roles.filter(r => r.roleId !== '1');
    }
    return Result.ok({
      user,
      roles,
    });
  }

  /**
   * 用户授权角色修改
   */
  @Put('/authRole')
  @PreAuthorize({ hasPermissions: ['system:user:edit'] })
  async authRoleAdd(
    @Body('userId') userId: string,
    @Body('roleIds') roleIds: string
  ): Promise<Result> {
    if (!userId) return Result.err();
    // 处理字符转id数组
    const ids = roleIds.split(',');
    if (ids.length <= 0) return Result.err();
    const user = await this.sysUserService.selectUserById(userId);
    if (!user) {
      return Result.errMsg('没有权限访问用户数据！');
    }
    await this.sysUserService.insertAserAuth(userId, [...new Set(ids)]);
    return Result.ok();
  }

  /**
   * 用户部门树列表
   */
  @PreAuthorize({ hasPermissions: ['system:user:list'] })
  @Get('/deptTree')
  async deptTree(@Query() sysDept: SysDept): Promise<Result> {
    const data = await this.sysDeptService.selectDeptTreeList(sysDept);
    return Result.okData(data || []);
  }
}
