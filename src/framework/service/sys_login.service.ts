import { Provide, Inject } from '@midwayjs/decorator';
import { SysUserService } from '../../modules/system/service/sys_user.service';
import { LoginBody } from '../core/types/login_body';
import { Context } from '@midwayjs/koa';
import { SysUser } from '../core/model/sys_user';
import { CAPTCHA_CODE_KEY } from '../../common/constant/cache_keys';
import { SysConfigService } from '../../modules/system/service/sys_config.service';
import { RedisCache } from '../redis/redis_cache';

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
  private redis_cache: RedisCache;

  @Inject()
  private sys_config_service: SysConfigService;

  @Inject()
  private sys_user_service: SysUserService;

  public async login(login_body: LoginBody): Promise<string> {
    // 验证码开关及验证码检查
    const captcha_enabled = await this.sys_config_service.select_captcha_enabled();
    if (captcha_enabled) {
      await this.validate_captcha(
        login_body.username,
        login_body.code,
        login_body.uuid
      );
    }
    // 用户验证

    throw new Error('Method not implemented.');
  }

  /**
   * 校验验证码
   * @param username 用户名
   * @param code 验证码
   * @param uuid 唯一标识
   * @return 结果
   */
  private async validate_captcha(
    username: string,
    code: string,
    uuid: string
  ): Promise<void> {
    const verify_key = CAPTCHA_CODE_KEY + uuid;
    const captcha = await this.redis_cache.get(verify_key);
    await this.redis_cache.del(verify_key);
    if (!captcha) {
      // 记录登录信息
      // TODO src/main/java/com/ruoyi/framework/manager/AsyncManager.java
      console.log(username, " user.captcha.expire ")
      // 验证码失效
      throw new Error('user.captcha.expire');
    }
    if (code !== captcha) {
      // 记录登录信息
      // TODO src/main/java/com/ruoyi/framework/manager/AsyncManager.java
      console.log(username, " user.captcha.error ")
      // 验证码错误
      throw 'user.captcha.error';
    }
    console.log("validate_captcha")
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
    return await this.sys_user_service.update_user_profile(user);
  }
}
