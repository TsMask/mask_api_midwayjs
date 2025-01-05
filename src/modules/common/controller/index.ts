import {
  Controller,
  Get,
  Inject,
  MidwayInformationService,
} from '@midwayjs/core';

import { Resp } from '../../../framework/resp/api';
import { RateLimit } from '../../../framework/decorator/RateLimitMethodDecorator';
import { LimitTypeEnum } from '../../../framework/enums/LimitTypeEnum';

/**
 * 路由主页
 */
@Controller('/')
export class IndexController {
  @Inject()
  private midwayInformationService: MidwayInformationService;

  @Get()
  @RateLimit({ time: 300, count: 60, limitType: LimitTypeEnum.IP })
  public async index(): Promise<Resp> {
    // 读取配置项目名版本
    const pkg = this.midwayInformationService.getPkg();
    return Resp.okMsg(
      `欢迎使用${pkg.name}后台管理框架，当前版本：${pkg.version}，请通过前端管理地址访问。`
    );
  }
}
