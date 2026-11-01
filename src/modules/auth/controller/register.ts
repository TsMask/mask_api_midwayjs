import { Controller, Body, Post, Inject } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';

import {
  validPassword,
  validMobile,
  validUsername,
} from '../../../internal/shared/regular/regular';
import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../internal/web/middleware/rate_limit';
import {
  ipaddrLocation,
  uaOsBrowser,
} from '../../../internal/web/reqctx/param';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../internal/shared/constants/common';
import { Resp } from '../../../internal/web/resp/api';
import { SysLoginLogService } from '../../system/service/sys_login_log';
import { RegisterService } from '../service/register';
import { RegisterBody } from '../model/register_body';
import { RegisterPhoneBody } from '../model/register_phone_body';

/**账号注册操作 控制层处理 */
@Controller('/api/v1/auth')
export class RegisterController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**账号注册操作服务 */
  @Inject()
  private registerService: RegisterService;

  /**系统登录访问服务 */
  @Inject()
  private sysLoginLogService: SysLoginLogService;

  /**账号注册 */
  @Post('/register', {
    middleware: [RateLimitMiddleware({ time: 300, count: 10, type: LIMIT_IP })],
  })
  public async register(@Body() body: RegisterBody): Promise<Resp> {
    // 当前请求信息
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);

    if (!validUsername(body.username) || validMobile(body.username)) {
      return Resp.errMsg('用户账号格式不正确，请输入用户名格式');
    }
    if (!validPassword(body.password)) {
      return Resp.errMsg(
        '登录密码至少包含大小写字母、数字、特殊符号，且不少于6位'
      );
    }
    if (body.password !== body.confirm_password) {
      return Resp.errMsg('用户确认输入密码不一致');
    }

    // 校验验证码
    const errMsg = await this.registerService.validateCaptcha(
      body.code,
      body.uuid
    );
    // 根据错误信息，创建系统访问记录
    if (errMsg) {
      const msg = `${errMsg} code ${body.code}`;
      await this.sysLoginLogService.insert(body.username, STATUS_NO, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(errMsg);
    }

    // 判断必传参数
    if (!validUsername(body.username)) {
      return Resp.errMsg('用户账号只能包含大写小写字母，数字，且不少于4位');
    }
    if (!validPassword(body.password)) {
      return Resp.errMsg(
        '登录密码至少包含大小写字母、数字、特殊符号，且不少于6位'
      );
    }
    if (body.password !== body.confirm_password) {
      return Resp.errMsg('用户确认输入密码不一致');
    }

    // 进行注册
    const [userId, err] = await this.registerService.byUserName(
      body.username,
      body.password
    );
    if (userId > 0) {
      const msg = `${body.username} 注册成功 ${userId}`;
      await this.sysLoginLogService.insert(body.username, STATUS_YES, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.okMsg('注册成功');
    }
    return Resp.errMsg(err);
  }

  /**手机号验证码注册 */
  @Post('/register-phone', {
    middleware: [RateLimitMiddleware({ time: 300, count: 10, type: LIMIT_IP })],
  })
  public async registerPhone(@Body() body: RegisterPhoneBody): Promise<Resp> {
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);

    const errMsg = await this.registerService.validateSmsCaptcha(
      body.phone,
      body.code,
      body.uuid
    );
    if (errMsg) {
      const msg = `${errMsg} code ${body.code}`;
      await this.sysLoginLogService.insert(body.phone, STATUS_NO, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(errMsg);
    }

    const [userId, err] = await this.registerService.byPhone(body.phone);
    if (userId > 0) {
      const msg = `${body.phone} 手机号注册成功 ${userId}`;
      await this.sysLoginLogService.insert(body.phone, STATUS_YES, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.okMsg('注册成功');
    }
    return Resp.errMsg(err);
  }
}
