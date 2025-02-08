import { Controller, Get, Inject } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';
import { ConfigObject, create, createMathExpr } from 'svg-captcha-fixed';
import svgBase64 = require('mini-svg-data-uri');

import {
  CAPTCHA_TYPE_CHAR,
  CAPTCHA_TYPE_MATH,
  CAPTCHA_EXPIRATION,
} from '../../../framework/constants/captcha';
import { CACHE_CAPTCHA_CODE } from '../../../framework/constants/cache_key';
import {
  LIMIT_IP,
  RateLimit,
} from '../../../framework/decorator/RateLimitMethodDecorator';
import { Resp } from '../../../framework/resp/api';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { GlobalConfig } from '../../../framework/config/config';
import { parseBoolean } from '../../../framework/utils/parse/parse';
import { generateCode } from '../../../framework/utils/generate/generate';
import { SysConfigService } from '../../system/service/sys_config';

/**验证码操作 控制层处理 */
@Controller()
export class CaptchaController {
  /**上下文 */
  @Inject()
  private c: Context;

  /**缓存操作 */
  @Inject()
  private redis: RedisCache;

  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**参数配置服务 */
  @Inject()
  private sysConfigService: SysConfigService;

  /**获取验证码-图片 */
  @Get('/captcha-image')
  @RateLimit({ time: 300, count: 60, limitType: LIMIT_IP })
  public async image(): Promise<Resp> {
    // 从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr = await this.sysConfigService.findValueByKey(
      'sys.account.captchaEnabled'
    );
    const captchaEnabled = parseBoolean(captchaEnabledStr);
    if (!captchaEnabled) {
      this.c.status = 200;
      return Resp.okData({ enabled: captchaEnabled });
    }

    // 生成唯一标识
    let verifyKey = '';
    const data = {
      enabled: captchaEnabled,
      uuid: '',
      img: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    };

    // 从数据库配置获取验证码类型 math 数值计算 char 字符验证
    const captchaType = await this.sysConfigService.findValueByKey(
      'sys.account.captchaType'
    );
    if (captchaType === CAPTCHA_TYPE_MATH) {
      const uuid = generateCode(20);
      const options: ConfigObject = this.config.get('mathCaptcha');
      const { data: question, text: answer } = createMathExpr(options);
      data.uuid = uuid;
      data.img = svgBase64(question);
      verifyKey = CACHE_CAPTCHA_CODE + ':' + uuid;
      await this.redis.setByExpire('', verifyKey, answer, CAPTCHA_EXPIRATION);
    }
    if (captchaType === CAPTCHA_TYPE_CHAR) {
      const uuid = generateCode(20);
      const options: ConfigObject = this.config.get('charCaptcha');
      const { data: question, text: answer } = create(options);
      data.uuid = uuid;
      data.img = svgBase64(question);
      verifyKey = CACHE_CAPTCHA_CODE + ':' + uuid;
      await this.redis.setByExpire('', verifyKey, answer, CAPTCHA_EXPIRATION);
    }

    // 本地开发下返回验证码结果，方便接口调试
    if (this.config.getEnv() === 'local') {
      const text = await this.redis.get('', verifyKey);
      return Resp.okData({ text, ...data });
    }
    return Resp.okData(data);
  }
}
