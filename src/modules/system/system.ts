import {
  MainApp,
  Configuration,
  Inject,
  type IMidwayApplication,
} from '@midwayjs/core';

import { registerOnOperationLog } from '../../internal/web/middleware/operate_log';
import { SysOperationLog } from './model/sys_operation_log';
import { SysOperationLogService } from './service/sys_operation_log';

/** System module assembly. */
@Configuration()
export class SystemModule {
  @MainApp()
  private app: IMidwayApplication;

  @Inject()
  private sysOperationLogService: SysOperationLogService;

  async onReady(): Promise<void> {
    registerOnOperationLog(async record => {
      try {
        await this.sysOperationLogService.insert({
          ...new SysOperationLog(),
          title: record.title,
          operation_type: record.operationType,
          operation_function: record.operationFunction,
          operation_url: record.operationUrl,
          operation_method: record.operationMethod,
          operation_ip: record.operationIp,
          operation_location: record.operationLocation,
          create_by: record.createBy,
          operation_param: record.operationParam,
          operation_status: record.operationStatus,
          operation_msg: record.operationMsg,
          operation_cost_time: record.operationCostTime,
        } as SysOperationLog);
      } catch (error) {
        this.app.getLogger().error('operation log insert err => %s', error);
      }
    });
  }
}

export const SystemConfiguration = {
  Configuration: SystemModule,
};
