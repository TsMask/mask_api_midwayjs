import {
  Controller,
  Get,
  Inject,
  MidwayInformationService,
} from '@midwayjs/core';

import {
  LIMIT_IP,
  RateLimit,
} from '../../../framework/decorator/RateLimitMethodDecorator';
import { Resp } from '../../../framework/resp/api';

/**路由主页 控制层处理 */
@Controller('/')
export class IndexController {
  @Inject()
  private midwayInformationService: MidwayInformationService;

  /**根路由 */
  @Get()
  @RateLimit({ time: 300, count: 60, type: LIMIT_IP })
  public async index(): Promise<Resp> {
    const pkg = this.midwayInformationService.getPkg();
    const msg = `Name:${pkg.name}, Version:${pkg.version}`;
    return Resp.okMsg(msg);
  }
}
