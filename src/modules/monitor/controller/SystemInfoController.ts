import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Result } from '../../../framework/vo/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { SystemInfoServiceImpl } from '../service/impl/SystemInfoServiceImpl';

/**
 * 服务器信息
 *
 * @author TsMask
 */
@Controller('/monitor/system-info')
export class SystemInfoController {
  @Inject()
  private systemInfoService: SystemInfoServiceImpl;

  /**
   * 服务器信息
   */
  @Get()
  @PreAuthorize({ hasPermissions: ['monitor:system:info'] })
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
