import { Controller, Get, HttpCode, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { create, createMathExpr } from 'svg-captcha';
import { CAPTCHA_CODE_KEY } from '../../../common/constant/cache_keys';
import { CAPTCHA_EXPIRATION } from '../../../common/constant/some';
import { generate_id } from '../../../common/utils/uid.utils';
import { Result } from '../../../framework/core/result';
import { RedisCache } from '../../../framework/redis/redis_cache';
import { SysConfigService } from '../../system/service/sys_config.service';

/**
 * 验证码操作处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller()
export class CaptchaApi {
  @Inject()
  private ctx: Context;

  @Inject()
  private redis_cache: RedisCache;

  @Inject()
  private sys_config_service: SysConfigService;

  /**
   * 生成验证码
   */
  @Get('/captchaImage')
  @HttpCode(200)
  async captcha_image(): Promise<Result> {
    // 从数据库配置获取验证码开关
    const captcha_enabled =
      await this.sys_config_service.select_captcha_enabled();
    if (!captcha_enabled) {
      return Result.ok({
        captchaEnabled: captcha_enabled,
      });
    }

    const uuid = generate_id(32);
    const verify_key = CAPTCHA_CODE_KEY + uuid;
    let img =
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

    // 从本地配置获取验证码类型
    const { captchaType } = this.ctx.app.getConfig('project');
    if (captchaType === 'math') {
      const captcha = createMathExpr(this.ctx.app.getConfig('mathCaptcha'));
      img = captcha.data;
      this.redis_cache.set_by_timeout(
        verify_key,
        captcha.text,
        CAPTCHA_EXPIRATION
      );
    }
    if (captchaType === 'char') {
      const captcha = create(this.ctx.app.getConfig('charCaptcha'));
      img = captcha.data;
      this.redis_cache.set_by_timeout(
        verify_key,
        captcha.text,
        CAPTCHA_EXPIRATION
      );
    }

    return Result.ok({
      img: img,
      uuid: uuid,
      captchaEnabled: captcha_enabled,
    });
  }
}
