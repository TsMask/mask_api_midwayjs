import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { Result } from '../../../framework/core/Result';

@Controller('/')
export class IndexController {
  @Inject()
  ctx: Context;

  @Get()
  async index(): Promise<Result> {
    // 从本地配置project项目名版本
    const { name, version } = this.ctx.app.getConfig('project');
    return Result.okMsg(
      `欢迎使用 ${name} 后台管理框架，当前版本：v${version}，请通过前端地址访问。`
    );
  }
}
