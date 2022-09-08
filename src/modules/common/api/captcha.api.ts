import { Controller, Get, HttpCode, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { create, createMathExpr } from 'svg-captcha';
import { R, R_OK } from '../../../common/core/r';

/**
 * 验证码操作处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller()
export class CaptchaApi {
  @Inject()
  ctx: Context;

  /**
   * 生成验证码
   */
  @Get('/captchaImage')
  @HttpCode(200)
  async captcha_image(): Promise<R> {
    const { captchaType } = this.ctx.app.getConfig('project');

    const captcha =
      captchaType === 'math'
        ? createMathExpr(this.ctx.app.getConfig('mathCaptcha'))
        : create(this.ctx.app.getConfig('charCaptcha'));
    console.log('验证码 %s', captcha.text);
    this.ctx.cookies.set('captcha', captcha.text, { encrypt: true });

    return R_OK({
      img: captcha.data,
      uuid: 'osndfnxnv=',
      captchaEnabled: true,
    });
  }
}
