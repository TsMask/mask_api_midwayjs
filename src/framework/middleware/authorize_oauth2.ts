import { IMiddleware, Middleware, createMiddleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

import { CTX_LOGIN_OAUTH2 } from '../constants/common';
import { authorization } from '../reqctx/context';
import { Oauth2TokenService } from '../token/oauth2_token';
import { Resp } from '../resp/api';

/**客户端授权认证校验-中间件 */
@Middleware()
export class AuthorizeOauth2 implements IMiddleware<Context, NextFunction> {
  resolve(_: any, scope: string[]) {
    return async (c: Context, next: NextFunction) => {
      const token: Oauth2TokenService = await c.requestContext.getAsync(
        Oauth2TokenService
      );

      // 获取请求头标识信息
      const tokenStr = authorization(c);
      if (tokenStr === '') {
        c.status = 401;
        return Resp.codeMsg(401003, 'authorization token is empty');
      }

      // 验证令牌
      const [claims, err] = await token.oauth2TokenVerify(tokenStr, 'access');
      if (err) {
        c.status = 401;
        return Resp.codeMsg(401001, err);
      }

      // 获取缓存的用户信息
      let info = await token.oauth2InfoGet(claims);
      if (info.clientId === '') {
        c.status = 401;
        return Resp.codeMsg(401002, 'invalid login user information');
      }
      c.setAttr(CTX_LOGIN_OAUTH2, info);

      // 客户端权限校验
      if (Array.isArray(scope) && scope.length > 0) {
        let hasScope = false;
        for (const item of info.scope) {
          for (const v of scope) {
            if (item === v) {
              hasScope = true;
              break;
            }
          }
        }
        if (!hasScope) {
          c.status = 403;
          return Resp.codeMsg(403001, `unauthorized access ${c.method} ${c.path}`);
        }
      }

      // 调用下一个处理程序
      return await next();
    };
  }

  static getName(): string {
    return 'AUTHORIZE_OAUTH2';
  }
}

/**
 * 客户端授权认证校验-中间件
 *
 * @param scope 授权范围数组
 */
export function AuthorizeOauth2Middleware(scope: string[]) {
  return createMiddleware(AuthorizeOauth2, scope, AuthorizeOauth2.getName());
}
