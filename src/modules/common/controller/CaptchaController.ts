import { Controller, Get, Inject } from '@midwayjs/decorator';
import { ConfigObject, create, createMathExpr } from 'svg-captcha';
import svgBase64 = require('mini-svg-data-uri');
import { CAPTCHA_CODE_KEY } from '../../../framework/constants/CacheKeysConstants';
import { generateID } from '../../../framework/utils/GenIdUtils';
import { Result } from '../../../framework/model/Result';
import { RedisCache } from '../../../framework/cache/RedisCache';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';
import { ContextService } from '../../../framework/service/ContextService';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import {
  CAPTCHA_TYPE_CHAR,
  CAPTCHA_TYPE_MATH,
  CAPTCHA_EXPIRATION,
} from '../../../framework/constants/CaptchaConstants';

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
   */
  @Get('/captchaImage')
  @RateLimit({ time: 300, count: 60, limitType: LimitTypeEnum.IP })
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
    if (captchaType === CAPTCHA_TYPE_MATH) {
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
    if (captchaType === CAPTCHA_TYPE_CHAR) {
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
