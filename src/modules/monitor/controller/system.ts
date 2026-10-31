import { Controller, Get, Inject } from '@midwayjs/core';

import { Resp } from '../../../internal/web/resp/api';
import { SystemInfoService } from '../service/system_info';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';

/**服务器监控信息 控制层处理 */
@Controller('/api/v1/monitor')
export class SystemInfoController {
  /**服务器系统相关信息服务 */
  @Inject()
  private systemInfoService: SystemInfoService;

  /**
   * 服务器信息
   */
  @Get('/system', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:system:info'] }),
    ],
  })
  public async info(): Promise<Resp> {
    const disk = await this.systemInfoService.diskInfo();
    return Resp.okData({
      project: this.systemInfoService.projectInfo(),
      cpu: this.systemInfoService.cpuInfo(),
      memory: this.systemInfoService.memoryInfo(),
      network: this.systemInfoService.networkInfo(),
      time: this.systemInfoService.timeInfo(),
      system: this.systemInfoService.systemInfo(),
      disk,
    });
  }
}
