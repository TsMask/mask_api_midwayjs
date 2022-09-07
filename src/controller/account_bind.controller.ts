import { Controller, Get, Post, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
@Controller('/account_bind')
export class AccountBindController {
  @Inject()
  ctx: Context;

  @Get('/')
  async sd() {
    return {
      c: this.ctx,
      b: this.ctx.ip,
      son: this.ctx.request.body,
    };
  }

  @Post('/')
  async home() {
    return {
      c: this.ctx,
      b: this.ctx.ip,
      son: this.ctx.request.body,
    };
  }

  @Post('/register')
  async register() {
    const { username, password } = this.ctx.request.body;

    return { username, password };
  }

  @Post('/logout')
  async logout() {
    const { username, password } = this.ctx.request.body;

    return { username, password };
  }
}
