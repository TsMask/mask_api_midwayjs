import { Controller, Get, HttpCode, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { create, createMathExpr } from 'svg-captcha';
import * as svgBase64 from 'mini-svg-data-uri';
import { CAPTCHA_CODE_KEY } from '../../../common/constants/CacheKeysConstants';
import { CAPTCHA_EXPIRATION } from '../../../common/constants/CommonConstants';
import { generateID } from '../../../common/utils/GenIdUtils';
import { Result } from '../../../framework/core/Result';
import { RedisCache } from '../../../framework/redis/RedisCache';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';

/**
 * 验证码操作处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller()
export class CaptchaController {
  @Inject()
  private ctx: Context;

  @Inject()
  private redisCache: RedisCache;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  /**
   * 获取验证码
   * @returns 返回结果
   */
  @Get('/captchaImage')
  @HttpCode(200)
  async captchaImage(): Promise<Result> {
    // 从数据库配置获取验证码开关
    const captchaEnabled = await this.sysConfigService.selectCaptchaEnabled();
    if (!captchaEnabled) {
      return Result.ok({
        captchaEnabled: captchaEnabled,
      });
    }

    // 生成唯一标识
    const uuid = generateID(16);
    const verifyKey = CAPTCHA_CODE_KEY + uuid;
    let data = {
      captchaEnabled: captchaEnabled,
      uuid: uuid,
      img: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    };
    // 从本地配置project获取验证码类型
    const { captchaType } = this.ctx.app.getConfig('project');
    if (captchaType === 'math') {
      const captcha = createMathExpr(this.ctx.app.getConfig('mathCaptcha'));
      data.img = svgBase64(captcha.data);
      await this.redisCache.setByExpire(
        verifyKey,
        captcha.text,
        CAPTCHA_EXPIRATION
      );
    }
    if (captchaType === 'char') {
      const captcha = create(this.ctx.app.getConfig('charCaptcha'));
      data.img = svgBase64(captcha.data);
      await this.redisCache.setByExpire(
        verifyKey,
        captcha.text,
        CAPTCHA_EXPIRATION
      );
    }
    // 本地开发下返回结果
    if (this.ctx.app.getEnv() === 'local') {
      data = Object.assign(
        {
          text: await this.redisCache.get(verifyKey),
        },
        data
      );
    }
    return Result.ok(data);
  }
}
