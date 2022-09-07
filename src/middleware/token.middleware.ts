import { IMiddleware } from '@midwayjs/core';
import { Middleware } from '@midwayjs/decorator';
import { NextFunction, Context } from '@midwayjs/koa';
// import { TokenService } from '../service/token.service';
// import { USER_NOT_LOGGIN_IN } from '../utils/result.utils';

@Middleware()
export class TokenMiddleware implements IMiddleware<Context, NextFunction> {
  resolve() {
    return async (ctx: Context, next: NextFunction) => {
      // 控制器前执行的逻辑
      const startTime = Date.now();
      ctx.logger.info('授权拦截 token time=> ', ctx.startTime);

      // const tokenService = await ctx.requestContext.getAsync<TokenService>(
      //   TokenService
      // );

      // const token = ctx.get('pd-client-token');
      // if (!token) {
      //   return USER_NOT_LOGGIN_IN;
      // }
      // const payload = await tokenService.verify(token);

      // ctx.setAttr('jti', payload.jti); // 登录用户ID
      // ctx.setAttr('aud', payload.aud); // 登录用户昵称

      // 执行下一个 Web 中间件，最后执行到控制器
      // 这里可以拿到下一个中间件或者控制器的返回值
      const result = await next();
      // 控制器之后执行的逻辑
      ctx.logger.info('授权拦截 token time=> ', Date.now() - startTime);
      // 返回给上一个中间件的结果
      return result;
    };
  }

  // 路由将忽略此中间件
  ignore(ctx: Context): boolean {
    const ignoreList: string[] = ['/', '/account/register', '/account_login'];
    ctx.logger.info('授权拦截 token ignore %s', ctx.path);

    // return ctx.path === '/account_login';

    return ignoreList.includes(ctx.path);
  }

  static getName(): string {
    return 'token';
  }
}
