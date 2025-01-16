import { Controller, Body, Post, Inject } from '@midwayjs/core';

import {
  validPassword,
  validUsername,
} from '../../../framework/utils/RegularUtils';
import { Resp } from '../../../framework/resp/api';
import { LIMIT_IP, RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { RegisterService } from '../service/register';
import { RegisterBody } from '../model/register_body';

/**
 * 账号注册操作处理
 */
@Controller()
export class RegisterController {
  @Inject()
  private registerService: RegisterService;

  /**
   * 系统注册
   */
  @Post('/register')
  @RateLimit({ time: 300, count: 20, limitType: LIMIT_IP })
  public async register(@Body() registerBody: RegisterBody): Promise<Resp> {
    const { username, password, confirmPassword } = registerBody;
    // 判断必传参数
    if (!validUsername(username)) {
      return Resp.errMsg(
        '账号不能以数字开头，可包含大写小写字母，数字，且不少于5位'
      );
    }
    if (!validPassword(password)) {
      return Resp.errMsg('密码至少包含大小写字母、数字、特殊符号，且不少于6位');
    }
    if (password !== confirmPassword) {
      return Resp.errMsg('用户确认输入密码不一致');
    }
    // 检查验证码
    await this.registerService.validateCaptcha(
      username,
      registerBody.code,
      registerBody.uuid
    );

    // 进行注册
    const msg = await this.registerService.register(username, password);
    if (msg !== 'ok') {
      return Resp.errMsg(msg);
    }
    return Resp.ok();
  }
}
