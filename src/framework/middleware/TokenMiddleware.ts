import { IMiddleware } from '@midwayjs/core';
import { UnauthorizedError } from '@midwayjs/core/dist/error/http';
import { Middleware } from '@midwayjs/decorator';
import { NextFunction, Context } from '@midwayjs/koa';
import { TokenService } from '../service/TokenService';

/**
 * token中间件
 * 验证token有效性
 *
 * @author TsMask <340112800@qq.com>
 */
@Middleware()
export class TokenMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 控制器前执行的逻辑
      const tokenService = await ctx.requestContext.getAsync<TokenService>(
        TokenService
      );
      // 获取用户信息
      let loginUser = await tokenService.getLoginUser();
      if (loginUser && loginUser.userId) {
        loginUser = await tokenService.verifyToken(loginUser);
        ctx.loginUser = loginUser;
        await next();
      } else {
        throw new UnauthorizedError('未授权');
      }
    };
  }

  // 路由将忽略此中间件
  ignore(ctx: Context): boolean {
    const ignoreList: string[] = [
      '/',
      '/captchaImage',
      '/login',
      '/getRouters',
    ];
    ctx.logger.info('授权拦截 token ignore %s', ctx.path);

    // return ctx.path === '/account_login';

    return ignoreList.includes(ctx.path);
  }

  static getName(): string {
    return 'token';
  }
}
