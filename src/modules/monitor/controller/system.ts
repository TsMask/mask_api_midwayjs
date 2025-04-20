import { Controller, Get, Inject } from '@midwayjs/core';

import { Resp } from '../../../framework/resp/api';
import { SystemInfoService } from '../service/system_info';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { AuthorizeOauth2Middleware } from '../../../framework/middleware/authorize_oauth2';

/**服务器监控信息 控制层处理 */
@Controller()
export class SystemInfoController {
  /**在线用户服务 */
  @Inject()
  private systemInfoService: SystemInfoService;

  /**
   * 服务器信息
   */
  @Get('/oauth2/open/monitor/system', {
    middleware: [AuthorizeOauth2Middleware([])],
  })
  @Get('/monitor/system', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:system:info'] }),
    ],
  })
  public async info(): Promise<Resp> {
    return Resp.okData({
      project: this.systemInfoService.projectInfo(),
      cpu: this.systemInfoService.cpuInfo(),
      memory: this.systemInfoService.memoryInfo(),
      network: this.systemInfoService.networkInfo(),
      time: this.systemInfoService.timeInfo(),
      system: this.systemInfoService.systemInfo(),
      disk: await this.systemInfoService.diskInfo(),
    });
  }
}
