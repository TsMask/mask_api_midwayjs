import { Body, Controller, Get, Inject, Post } from '@midwayjs/core';
import { ConfigObject, create, createMathExpr } from 'svg-captcha-fixed';
import svgBase64 = require('mini-svg-data-uri');
import type { Context } from '@midwayjs/koa';

import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../internal/web/middleware/rate_limit';
import {
  CACHE_CAPTCHA_CODE,
  CACHE_SMS_CODE,
  CACHE_SMS_CODE_COOLDOWN,
} from '../../../internal/shared/constants/cache_key';
import {
  generateCode,
  generateNumber,
} from '../../../internal/shared/generate/generate';
import {
  parseBoolean,
  parseNumber,
} from '../../../internal/shared/parse/parse';
import { RedisCache } from '../../../internal/infra/cache/redis';
import { GlobalConfig } from '../../../internal/config/config';
import { validMobile } from '../../../internal/shared/regular/regular';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { SysConfigService } from '../../system/service/sys_config';

/**验证码操作 控制层处理 */
@Controller('/api/v1/auth')
export class CaptchaController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**缓存服务 */
  @Inject()
  private redisCache: RedisCache;

  /**配置信息 */
  @Inject()
  private config: GlobalConfig;

  /**参数配置服务 */
  @Inject()
  private sysConfigService: SysConfigService;

  /**获取验证码-图片 */
  @Get('/captcha-image', {
    middleware: [RateLimitMiddleware({ time: 300, count: 60, type: LIMIT_IP })],
  })
  public async image(): Promise<Resp> {
    // 从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr = await this.sysConfigService.findValueByKey(
      'sys.account.captcha_enabled',
      'sys.account.captchaEnabled'
    );
    const captchaEnabled = parseBoolean(captchaEnabledStr);
    if (!captchaEnabled) {
      return Resp.okData({ enabled: captchaEnabled });
    }

    // 生成唯一标识
    let verifyKey = '';
    const data = {
      enabled: captchaEnabled,
      uuid: '',
      img: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    };

    // 验证码有效期，单位秒
    const captchaExpiration = 2 * 60;
    // 从数据库配置获取验证码类型 math 数值计算 char 字符验证
    const captchaType = await this.sysConfigService.findValueByKey(
      'sys.account.captcha_type',
      'sys.account.captchaType'
    );
    if (captchaType === 'math') {
      const uuid = generateCode(20);
      const options: ConfigObject = this.config.get('mathCaptcha');
      const { data: question, text: answer } = createMathExpr(options);
      data.uuid = uuid;
      data.img = svgBase64(question);
      verifyKey = CACHE_CAPTCHA_CODE + ':' + uuid;
      await this.redisCache.set('', verifyKey, answer, captchaExpiration);
    }
    if (captchaType === 'char') {
      const uuid = generateCode(20);
      const options: ConfigObject = this.config.get('charCaptcha');
      const { data: question, text: answer } = create(options);
      data.uuid = uuid;
      data.img = svgBase64(question);
      verifyKey = CACHE_CAPTCHA_CODE + ':' + uuid;
      await this.redisCache.set(
        '',
        verifyKey,
        answer.toLowerCase(),
        captchaExpiration
      );
    }

    // 本地开发下返回验证码结果，方便接口调试
    if (this.config.getEnv() === 'local') {
      const text = await this.redisCache.get('', verifyKey);
      return Resp.okData({ text, ...data });
    }
    return Resp.okData(data);
  }

  /**发送手机号登录验证码 */
  @Post('/captcha-sms', {
    middleware: [RateLimitMiddleware({ time: 300, count: 60, type: LIMIT_IP })],
  })
  public async sms(@Body() body: Record<string, string>): Promise<Resp> {
    const phone = body?.phone || '';
    if (!validMobile(phone)) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, '请输入正确的手机号码');
    }
    if (this.config.getEnv() !== 'local') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, '短信服务未配置');
    }

    const expiresIn = await this.configSeconds(
      'sys.account.captcha_sms_expires_in_seconds',
      300
    );
    const resendInterval = await this.configSeconds(
      'sys.account.captcha_sms_resend_interval_seconds',
      60
    );
    const cooldownKey = CACHE_SMS_CODE_COOLDOWN + ':' + phone;
    if (await this.redisCache.get('', cooldownKey)) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, '验证码发送过于频繁，请稍后再试');
    }

    const code = String(generateNumber(6)).padStart(6, '0');
    const uuid = generateCode(32);
    const codeKey = CACHE_SMS_CODE + ':' + uuid;
    const created = await this.redisCache.set(
      '',
      codeKey,
      `${phone}:${code}`,
      expiresIn
    );
    const cooldownCreated = await this.redisCache.set(
      '',
      cooldownKey,
      phone,
      resendInterval
    );
    if (!created || !cooldownCreated) {
      await this.redisCache.del('', codeKey);
      await this.redisCache.del('', cooldownKey);
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, '验证码生成失败');
    }

    return Resp.okData({
      uuid,
      expires_in: expiresIn,
      resend_interval: resendInterval,
      ...(this.config.getEnv() === 'local' ? { text: code } : {}),
    });
  }

  private async configSeconds(key: string, defaultValue: number) {
    const value = parseNumber(await this.sysConfigService.findValueByKey(key));
    return value > 0 ? value : defaultValue;
  }
}
