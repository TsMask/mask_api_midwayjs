import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';

@Controller('/')
export class IndexController {
  @Inject()
  ctx: Context;

  @Get('/')
  async index(): Promise<string> {
    const { name, version } = this.ctx.app.getConfig('project');
    return `欢迎使用${name}后台管理框架，当前版本：v${version}，请通过前端地址访问。`;
  }
}
