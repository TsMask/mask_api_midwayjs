import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SystemInfoService } from '../../../framework/service/SystemInfoService';

/**
 * 服务器监控
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/monitor/server')
export class ServerController {
  @Inject()
  private systemInfoService: SystemInfoService;

  /**
   * 服务器信息
   */
  @Get()
  @PreAuthorize({ hasPermissions: ['monitor:server:query'] })
  async getInfo(): Promise<Result> {
    return Result.okData({
      project: this.systemInfoService.getProjectInfo(),
      cpu: this.systemInfoService.getCPUInfo(),
      memory: this.systemInfoService.getMemoryInfo(),
      network: this.systemInfoService.getNetworkInfo(),
      time: this.systemInfoService.getTimeInfo(),
      system: this.systemInfoService.getSystemInfo(),
      disk: await this.systemInfoService.getDiskInfo(),
    });
  }
}
