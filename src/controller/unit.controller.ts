import {
  Inject,
  Controller,
  Get,
  Post,
  Body,
  Query,
} from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';

@Controller('/unit')
export class UnitController {
  @Inject()
  ctx: Context;

  @Get('/')
  async get_index(@Query('uid') uid: string) {
    return {
      uid,
      request: this.ctx.request,
      response: this.ctx.response,
      ips: this.ctx.ip,
      body: this.ctx.request.body,
    };
  }

  @Post('/')
  async post_index(@Body('uid') uid: string) {
    return { uid, ctx: this.ctx };
  }
}
