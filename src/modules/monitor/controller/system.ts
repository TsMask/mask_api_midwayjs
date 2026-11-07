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
    const [cpu, memory, disk, time, system] = await Promise.all([
      this.systemInfoService.cpuInfo(),
      this.systemInfoService.memoryInfo(),
      this.systemInfoService.diskInfo(),
      this.systemInfoService.timeInfo(),
      this.systemInfoService.systemInfo(),
    ]);
    return Resp.okData({
      project: this.systemInfoService.projectInfo(),
      cpu,
      memory,
      network: this.systemInfoService.networkInfo(),
      time,
      system,
      disk,
    });
  }
}
