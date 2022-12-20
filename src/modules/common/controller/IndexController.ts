import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { ContextService } from '../../../framework/service/ContextService';

@Controller('/')
export class IndexController {
  @Inject()
  private contextService: ContextService;

  @Get()
  async index(): Promise<Result> {
    // 读取配置项目名版本
    const { name, version } = this.contextService.getConfig('project');
    return Result.okMsg(
      `欢迎使用 ${name} 后台管理框架，当前版本：v${version}，请通过前端地址访问。`
    );
  }
}
