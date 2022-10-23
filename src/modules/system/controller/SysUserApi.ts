import { Controller, Get, Inject, Body } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { Result } from '../../../framework/core/Result';
import { SysUser } from '../../../framework/core/model/SysUser';
import { SysUserServiceImpl } from '../service/impl/SysUserServiceImpl';

@Controller('/system/user')
export class SysUserApi {
  @Inject()
  private ctx: Context;

  @Inject()
  private sysUserService: SysUserServiceImpl;

  @Get('/')
  async sd() {
    const user = await this.sysUserService.selectUserByUserName('admin');
    return {
      user,
      c: this.ctx,
      b: this.ctx.ip,
      son: this.ctx.request.body,
    };
  }

  /**
   * 获取用户列表
   */
  //  @PreAuthorize("@ss.hasPermi('system:user:list')")
  @Get('/list')
  async list(@Body('sys_user') sys_user: SysUser) {
    //  startPage();
    const [rows, total] = await this.sysUserService.selectUserList(sys_user);
    return Result.ok({ rows, total });
  }
}
