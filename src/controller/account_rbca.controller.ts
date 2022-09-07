import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
@Controller('/account_rbca')
export class AccountRBCAController {
  @Inject()
  ctx: Context;

  @Get('/')
  async get_index(@Query('uid') uid: string) {
    return {
      uid,
      ctx: this.ctx,
    };
  }

  @Post('/')
  async post_index(@Body('uid') uid: string) {
    return { uid, ctx: this.ctx };
  }
}
