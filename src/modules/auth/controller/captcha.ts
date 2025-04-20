import { Controller, Get, Inject } from '@midwayjs/core';
import { ConfigObject, create, createMathExpr } from 'svg-captcha-fixed';
import svgBase64 = require('mini-svg-data-uri');

import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../framework/middleware/rate_limit';
import { CACHE_CAPTCHA_CODE } from '../../../framework/constants/cache_key';
import { generateCode } from '../../../framework/utils/generate/generate';
import { parseBoolean } from '../../../framework/utils/parse/parse';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { GlobalConfig } from '../../../framework/config/config';
import { Resp } from '../../../framework/resp/api';
import { SysConfigService } from '../../system/service/sys_config';

/**验证码操作 控制层处理 */
@Controller()
export class CaptchaController {
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
    middleware: [RateLimitMiddleware({ time: 300, count: 6, type: LIMIT_IP })],
  })
  public async image(): Promise<Resp> {
    // 从数据库配置获取验证码开关 true开启，false关闭
    const captchaEnabledStr = await this.sysConfigService.findValueByKey(
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
}
