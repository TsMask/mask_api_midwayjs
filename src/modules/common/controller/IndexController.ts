import { MidwayInformationService } from '@midwayjs/core';
import { Controller, Get, Inject } from '@midwayjs/decorator';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';
import { Result } from '../../../framework/model/Result';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';

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
  @RateLimit({ time: 300, count: 60, limitType: LimitTypeEnum.IP })
  async index(): Promise<Result> {
    // 读取配置项目名版本
    const pkg = this.midwayInformationService.getPkg();
    return Result.okMsg(
      `欢迎使用${pkg.name}后台管理框架，当前版本：${pkg.version}，请通过前端管理地址访问。`
    );
  }
}
