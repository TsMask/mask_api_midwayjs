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

/**路由主页 */
@Controller('/')
export class IndexController {
  @Inject()
  private midwayInformationService: MidwayInformationService;

  /**根路由 */
  @Get()
  @RateLimit({ time: 300, count: 60, limitType: LIMIT_IP })
  public async index(): Promise<Resp> {
    const pkg = this.midwayInformationService.getPkg();
    return Resp.okMsg(
      `欢迎使用 ${pkg.name} 后台服务，当前版本：${pkg.version}，请通过前台服务地址访问。`
    );
  }
}
