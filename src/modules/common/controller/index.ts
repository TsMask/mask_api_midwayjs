import {
  Controller,
  Get,
  Inject,
  MidwayInformationService,
} from '@midwayjs/core';

import {
  RateLimitMiddleware,
  LIMIT_IP,
} from '../../../framework/middleware/rate_limit';
import { Resp } from '../../../framework/resp/api';

/**路由主页 控制层处理 */
@Controller('/')
export class IndexController {
  /**内置的信息服务，提供基础的项目数据 */
  @Inject()
  private midwayInformationService: MidwayInformationService;

  /**根路由 */
  @Get('', {
    middleware: [RateLimitMiddleware({ time: 300, count: 60, type: LIMIT_IP })],
  })
  public async index(): Promise<Resp> {
    const pkg = this.midwayInformationService.getPkg();
    return Resp.okData({
      name: pkg.name,
      version: pkg.version,
    });
  }
}
