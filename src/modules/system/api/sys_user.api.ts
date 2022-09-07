import { Controller, Get, Inject, Body } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { SysUserService } from '../service/sys_user.service';
import { SysUser } from '../model/sys_user';
import { R_OK_ROWS } from '../../../common/core/r';

@Controller('/system/user')
export class SysUserApi {
  @Inject()
  ctx: Context;

  @Inject()
  user_service: SysUserService;

  @Get('/')
  async sd() {
    const user = await this.user_service.select_user_by_user_name('admin');
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
    const [rows, total] = await this.user_service.select_user_List(sys_user);
    return R_OK_ROWS(rows, total);
  }
}
