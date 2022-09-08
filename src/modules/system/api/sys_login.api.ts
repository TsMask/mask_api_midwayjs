import { Controller, Body, Post, Get, HttpCode, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { TOKEN } from '../../../common/constant/some';
import { R_Ok_DATA } from '../../../common/core/r';
import { LoginBody } from '../../../common/core/types/login_body';
import { create as SvgCaptcha } from 'svg-captcha';

@Controller()
export class SysLoginApi {
  @Inject()
  ctx: Context;

  @Post('/login')
  async login(@Body() loginBody: LoginBody) {
    return R_Ok_DATA({
        [TOKEN]: "log"
    });
  }

  @Post('/')
  async home() {
    return {
      c: this.ctx,
      b: this.ctx.ip,
      son: this.ctx.request.body,
    };
  }

  @Get('/')
  @HttpCode(200)
  async svg(): Promise<string> {
    var captcha = SvgCaptcha({
      noise: 4, // 干扰线条的数量
      color: true, // 验证码的字符是否有颜色，默认没有，如果设定了背景，则默认有
      background: '#f5f5f5', // 验证码图片背景颜色
        size: 4, // 验证码长度
        ignoreChars: '0o1i', // 验证码字符中排除 0o1i
    });
    console.log(captcha.text);
    this.ctx.cookies.set('captcha', captcha.text, { encrypt: true });

    return captcha.data;
  }

  @Post('/logout')
  async logout() {
    const { username, password } = this.ctx.request.body;

    return { username, password };
  }
}
