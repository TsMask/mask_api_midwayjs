import { Controller, Get, Inject } from '@midwayjs/core';

import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { SystemInfoService } from '../service/system_info';

/**服务器监控信息 控制层处理 */
@Controller('/monitor/system')
export class SystemInfoController {
  @Inject()
  private systemInfoService: SystemInfoService;

  /**
   * 服务器信息
   */
  @Get()
  @PreAuthorize({ hasPermissions: ['monitor:system:info'] })
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
