import { Controller, Get, Inject } from '@midwayjs/core';
import { ConfigObject, create, createMathExpr } from 'svg-captcha';
import svgBase64 = require('mini-svg-data-uri');

import {
  CAPTCHA_TYPE_CHAR,
  CAPTCHA_TYPE_MATH,
  CAPTCHA_EXPIRATION,
} from '../../../framework/constants/captcha';
import { Resp } from '../../../framework/resp/api';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { ContextService } from '../../../framework/service/ContextService';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { CACHE_CAPTCHA_CODE } from '../../../framework/constants/cache-key';
import { parseBoolean } from '../../../framework/utils/ValueParseUtils';
import { generateHash } from '../../../framework/utils/GenIdUtils';
import { SysConfigServiceImpl } from '../../system/service/impl/SysConfigServiceImpl';

/**
 * 验证码操作处理
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
   * 获取验证码-图片
   */
  @Get('/captcha-image')
  @RateLimit({ time: 300, count: 60, limitType: LimitTypeEnum.IP })
  public async image(): Promise<Resp> {
    // 从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr =
      await this.sysConfigService.selectConfigValueByKey(
        'sys.account.captchaEnabled'
      );
    const captchaEnabled = parseBoolean(captchaEnabledStr);
    if (!captchaEnabled) {
      return Resp.okData({
        enabled: captchaEnabled,
      });
    }

    // 生成唯一标识
    let verifyKey = '';
    const data = {
      enabled: captchaEnabled,
      uuid: '',
      img: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    };

    // 从数据库配置获取验证码类型 math 数值计算 char 字符验证
    const captchaType = await this.sysConfigService.selectConfigValueByKey(
      'sys.account.captchaType'
    );
    if (captchaType === CAPTCHA_TYPE_MATH) {
      const uuid = generateHash(20);
      const options: ConfigObject =
        this.contextService.getConfig('mathCaptcha');
      const { data: question, text: answer } = createMathExpr(options);
      data.uuid = uuid;
      data.img = svgBase64(question);
      verifyKey = CACHE_CAPTCHA_CODE + uuid;
      await this.redisCache.setByExpire(verifyKey, answer, CAPTCHA_EXPIRATION);
    }
    if (captchaType === CAPTCHA_TYPE_CHAR) {
      const uuid = generateHash(20);
      const options: ConfigObject =
        this.contextService.getConfig('charCaptcha');
      const { data: question, text: answer } = create(options);
      data.uuid = uuid;
      data.img = svgBase64(question);
      verifyKey = CACHE_CAPTCHA_CODE + uuid;
      await this.redisCache.setByExpire(
        verifyKey,
        answer.toLowerCase(),
        CAPTCHA_EXPIRATION
      );
    }

    // 本地开发下返回验证码结果，方便接口调试
    if (this.contextService.getEnv() === 'local') {
      const text = await this.redisCache.get(verifyKey);
      return Resp.okData({ text, ...data });
    }
    return Resp.okData(data);
  }
}
