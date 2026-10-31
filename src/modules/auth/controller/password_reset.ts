import { Body, Controller, Inject, Post } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';

import { validPassword } from '../../../internal/shared/regular/regular';
import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../internal/web/middleware/rate_limit';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { PasswordResetService } from '../service/password_reset';

/**找回密码操作 控制层处理 */
@Controller('/api/v1/auth/password-reset')
export class PasswordResetController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private passwordResetService: PasswordResetService;

  /**查询密码找回联系方式 */
  @Post('/lookup', {
    middleware: [RateLimitMiddleware({ time: 60, count: 30, type: LIMIT_IP })],
  })
  public async lookup(@Body('username') username: string): Promise<Resp> {
    if (!username) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: username is required');
    }

    const result = await this.passwordResetService.lookup(username);
    if (typeof result === 'string') {
      return Resp.errMsg(result);
    }
    return Resp.okData({
      channel: result.channel,
      masked_contact: result.maskedContact,
    });
  }

  /**发送密码找回验证码 */
  @Post('/captcha-email', {
    middleware: [RateLimitMiddleware({ time: 60, count: 30, type: LIMIT_IP })],
  })
  public async captchaEmail(@Body('username') username: string): Promise<Resp> {
    if (!username) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: username is required');
    }

    const result = await this.passwordResetService.sendCaptchaEmail(username);
    if (typeof result === 'string') {
      return Resp.errMsg(result);
    }
    return Resp.okData(result);
  }

  /**重置登录密码 */
  @Post('', {
    middleware: [RateLimitMiddleware({ time: 60, count: 30, type: LIMIT_IP })],
  })
  public async reset(@Body() body: Record<string, string>): Promise<Resp> {
    const username = body?.username || '';
    const code = body?.code || '';
    const uuid = body?.uuid || '';
    const password = body?.password || '';
    const confirmPassword = body?.confirm_password || body?.confirmPassword;
    if (!username || !code || !uuid || !password || !confirmPassword) {
      this.c.status = 422;
      return Resp.codeMsg(
        CODE_PARAM_CHEACK,
        'bind err: username, code, uuid, password and confirm_password are required'
      );
    }
    if (!validPassword(password)) {
      return Resp.errMsg(
        '登录密码至少包含大小写字母、数字、特殊符号，且不少于6位'
      );
    }
    if (password !== confirmPassword) {
      return Resp.errMsg('两次输入的新密码不一致');
    }

    const errMsg = await this.passwordResetService.reset(
      username,
      code,
      uuid,
      password
    );
    if (errMsg) {
      return Resp.errMsg(errMsg);
    }
    return Resp.okMsg('重置密码成功，请使用新密码登录');
  }
}
