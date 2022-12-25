import { Controller, Get, HttpCode, Inject } from '@midwayjs/decorator';
import { ConfigObject, create, createMathExpr } from 'svg-captcha';
import svgBase64 = require('mini-svg-data-uri');
import { CAPTCHA_CODE_KEY } from '../../../common/constants/CacheKeysConstants';
import { CAPTCHA_EXPIRATION } from '../../../common/constants/CommonConstants';
import { generateID } from '../../../common/utils/GenIdUtils';
import { Result } from '../../../framework/core/Result';
import { RedisCache } from '../../../framework/redis/RedisCache';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';

/**
 * 验证码操作处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller()
export class CaptchaController {
  @Inject()
  private contextService: ContextService;

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
    const data = {
      captchaEnabled: captchaEnabled,
      uuid: uuid,
      img: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    };

    // 从数据库配置获取验证码类型
    const captchaType = await this.sysConfigService.selectCaptchaType();
    if (captchaType === 'math') {
      const options: ConfigObject =
        this.contextService.getConfig('mathCaptcha');
      const captcha = createMathExpr(options);
      data.img = svgBase64(captcha.data);
      await this.redisCache.setByExpire(
        verifyKey,
        captcha.text,
        CAPTCHA_EXPIRATION
      );
    }
    if (captchaType === 'char') {
      const options: ConfigObject =
        this.contextService.getConfig('charCaptcha');
      const captcha = create(options);
      data.img = svgBase64(captcha.data);
      await this.redisCache.setByExpire(
        verifyKey,
        captcha.text,
        CAPTCHA_EXPIRATION
      );
    }

    // 本地开发下返回验证码结果
    if (this.contextService.getEnv() === 'local') {
      const text = await this.redisCache.get(verifyKey);
      return Result.ok({ text, ...data });
    }
    return Result.ok(data);
  }
}
