import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import {
  HEADER_PREFIX,
  JWT_CLIENT_ID,
  JWT_DEVICE_ID,
} from '../../../framework/constants/token';
import {
  deviceFingerprint,
  ipaddrLocation,
  uaOsBrowser,
} from '../../../framework/reqctx/param';
import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../framework/middleware/rate_limit';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { Oauth2TokenService } from '../../../framework/token/oauth2_token';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { Oauth2LogLoginService } from '../service/oauth2_log_login';
import { Oauth2ClientService } from '../service/oauth2_client';
import { Oauth2Service } from '../service/oauth2';
import { CodeQuery } from '../model/code_query';
import { TokenBody } from '../model/token_body';

/**用户授权第三方应用认证 控制层处理 */
@Controller('/oauth2')
export class Oauth2Controller {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**Token工具 */
  @Inject()
  private token: Oauth2TokenService;

  /**用户授权第三方信息服务 */
  @Inject()
  private oauth2Service: Oauth2Service;

  /**用户授权第三方应用信息服务 */
  @Inject()
  private oauth2ClientService: Oauth2ClientService;

  /**用户授权第三方应用登录日志 */
  @Inject()
  private oauth2LogLoginService: Oauth2LogLoginService;

  /**获取登录预授权码 */
  @Get('/authorize', {
    middleware: [RateLimitMiddleware({ time: 60, count: 30, type: LIMIT_IP })],
  })
  public async authorize(@Query() query: CodeQuery): Promise<Resp> {
    // 是否存在clientId
    const info = await this.oauth2ClientService.findByClientId(query.clientId);
    if (info.clientId == '' || info.clientId != query.clientId) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'clientId not exist');
    }

    // 判断IP白名单
    if (!info.ipWhite.includes(this.c.ip)) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'IP whitelist mismatch');
    }

    // 生成登录预授权码
    const code = await this.oauth2Service.createCode();

    const redirectURL = `${query.redirectUrl}?code=${code}&state=${query.state}`;
    this.c.status = 302;
    this.c.redirect(redirectURL);
  }

  /**通过授权码获取访问令牌 */
  @Post('/token', {
    middleware: [RateLimitMiddleware({ time: 180, count: 15, type: LIMIT_IP })],
  })
  public async createToken(@Body() body: TokenBody): Promise<Resp> {
    if (body.grantType != 'authorization_code' || body.code == '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'grantType or code error');
    }

    // 当前请求信息
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);

    // 校验验证码 根据错误信息，创建系统访问记录
    const err = await this.oauth2Service.validateCode(body.code);
    if (err) {
      const msg = `${err} code ${body.code}`;
      await this.oauth2LogLoginService.insert(body.clientId, STATUS_NO, msg, [
        ipaddr,
        location,
        os,
        browser,
      ]);
      return Resp.errMsg(err);
    }

    // 登录客户端信息
    let [info, errMsg] = await this.oauth2Service.byClient(
      body.clientId,
      body.clientSecret
    );
    if (errMsg) {
      await this.oauth2LogLoginService.insert(
        body.clientId,
        STATUS_NO,
        errMsg,
        [ipaddr, location, os, browser]
      );
      return Resp.errMsg(errMsg);
    }
    const deviceFingerprintStr = await deviceFingerprint(this.c, info.clientId);

    // 生成访问令牌
    const [accessToken, expiresIn] = await this.token.oauth2TokenCreate(
      info.clientId,
      deviceFingerprintStr,
      'access'
    );
    if (accessToken == '' || expiresIn == 0) {
      return Resp.errMsg('token generation failed');
    }
    // 生成刷新令牌
    const [refreshToken, refreshExpiresIn] = await this.token.oauth2TokenCreate(
      info.clientId,
      deviceFingerprintStr,
      'refresh'
    );

    // 记录令牌，创建系统访问记录
    info = await this.token.oauth2InfoCreate(info, deviceFingerprintStr, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    await this.oauth2Service.updateLoginDateAndIP(info);
    await this.oauth2LogLoginService.insert(
      body.clientId,
      STATUS_YES,
      '授权成功',
      [ipaddr, location, os, browser]
    );
    return Resp.okData({
      tokenType: HEADER_PREFIX,
      accessToken: accessToken,
      expiresIn: expiresIn,
      refreshToken: refreshToken,
      refreshExpiresIn: refreshExpiresIn,
    });
  }

  /**通过刷新令牌续期访问令牌 */
  @Post('/refresh-token', {
    middleware: [RateLimitMiddleware({ time: 60, count: 5, type: LIMIT_IP })],
  })
  public async refreshToken(@Body() body: TokenBody): Promise<Resp> {
    if (body.grantType != 'refresh_token' || body.refreshToken == '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'grantType or refreshToken error');
    }

    // 验证刷新令牌是否有效
    const [claims, err] = await this.token.oauth2TokenVerify(
      body.refreshToken,
      'refresh'
    );
    if (err != '') {
      return Resp.errMsg(err);
    }
    const clientId = claims[JWT_CLIENT_ID];

    // 客户端信息
    let [info, errMsg] = await this.oauth2Service.byClient(
      body.clientId,
      body.clientSecret
    );
    if (errMsg != '') {
      return Resp.errMsg(errMsg);
    }

    // 客户端ID是否一致
    if (clientId != body.clientId) {
      return Resp.errMsg('clientId mismatch');
    }
    // 设备指纹信息是否一致
    const deviceId = claims[JWT_DEVICE_ID];
    const deviceFingerprintStr = await deviceFingerprint(this.c, clientId);
    if (deviceId != deviceFingerprintStr) {
      return Resp.errMsg('device fingerprint mismatch');
    }

    // 生成访问令牌
    const [accessToken, expiresIn] = await this.token.oauth2TokenCreate(
      clientId,
      deviceFingerprintStr,
      'access'
    );
    if (accessToken == '' || expiresIn == 0) {
      return Resp.errMsg('token generation failed');
    }
    // 生成刷新令牌
    const now = Math.round(Date.now() / 1000);
    const exp = parseNumber(claims['exp']);
    const iat = parseNumber(claims['iat']);
    let refreshExpiresIn = Math.round(exp - now);
    let refreshToken = body.refreshToken;

    // 如果当前时间大于过期时间的一半，则生成新令牌
    const halfExp = exp - Math.round(now - iat) / 2;
    if (now > halfExp) {
      [refreshToken, refreshExpiresIn] = await this.token.oauth2TokenCreate(
        clientId,
        deviceFingerprintStr,
        'refresh'
      );
    }

    // 当前请求信息
    const [ipaddr, location] = await ipaddrLocation(this.c);
    const [os, browser] = await uaOsBrowser(this.c);
    // 记录令牌，创建系统访问记录
    info = await this.token.oauth2InfoCreate(info, deviceFingerprintStr, [
      ipaddr,
      location,
      os,
      browser,
    ]);
    await this.oauth2Service.updateLoginDateAndIP(info);
    await this.oauth2LogLoginService.insert(
      info.clientId,
      STATUS_YES,
      '刷新访问令牌成功',
      [ipaddr, location, os, browser]
    );

    return Resp.okData({
      tokenType: HEADER_PREFIX,
      accessToken: accessToken,
      expiresIn: expiresIn,
      refreshToken: refreshToken,
      refreshExpiresIn: refreshExpiresIn,
    });
  }
}
