import { MidwayInformationService } from '@midwayjs/core';
import { Controller, Get, Inject } from '@midwayjs/decorator';
import { LimitTypeEnum } from '../../../common/enums/LimitTypeEnum';
import { Result } from '../../../framework/core/Result';
import { RateLimit } from '../../../framework/decorator/RateLimitDecorator';

/**
 * 路由主页
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/')
export class IndexController {
  @Inject()
  private midwayInformationService: MidwayInformationService;

  @Get()
  @RateLimit({ time: 5, count: 10, limitType: LimitTypeEnum.USER })
  async index(): Promise<Result> {
    // 读取配置项目名版本
    const pkg = this.midwayInformationService.getPkg();
    return Result.okMsg(
      `欢迎使用${pkg.name}后台管理框架，当前版本：${pkg.version}，请通过前端管理地址访问。`
    );
  }
}
