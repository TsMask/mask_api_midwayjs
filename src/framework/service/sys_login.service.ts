import { Provide, Inject } from '@midwayjs/decorator';
import { SysUserService } from '../../modules/system/service/sys_user.service';
import { LoginBody } from '../core/types/login_body';
import { Context } from '@midwayjs/koa';
import { SysUser } from '../core/model/sys_user';

/**
 * 登录校验方法
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysLoginService {
  @Inject()
  private ctx: Context;

  @Inject()
  private user_service: SysUserService;

  public async login(user: LoginBody): Promise<string> {
    throw new Error('Method not implemented.');
  }

  /**
   * 记录登录信息
   * @param user_id 用户ID
   * @returns 是否登记完成
   */
  public async record_login_info(user_id: string) {
    const user = new SysUser();
    user.user_id = user_id;
    user.login_ip = this.ctx.ip;
    user.login_date = new Date();
    return await this.user_service.update_user(user);
  }
}
