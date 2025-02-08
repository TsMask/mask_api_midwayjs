import { Controller, Inject, Get, Del, Post, Query } from '@midwayjs/core';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/reqctx/context';
import { SysLogOperateService } from '../service/sys_log_operate';

/**操作日志记录信息 控制层处理 */
@Controller('/system/log/operate')
export class SysLogOperateController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysLogOperateService: SysLogOperateService;

  /**
   * 操作日志列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:log:operate:list'] })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const dataScopeSQL = this.contextService.getDataScopeSQL(
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysLogOperateService.findByPage(
      query,
      dataScopeSQL
    );
    return Resp.okData({ rows, total });
  }

  /**
   * 操作日志清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['system:log:operate:remove'] })
  @OperateLog({ title: '操作日志', businessType: BUSINESS_TYPE.CLEAN })
  public async clean(): Promise<Resp> {
    const rows = await this.sysLogOperateService.clean();
    return Resp.okData(rows);
  }

  /**
   * 导出操作日志
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:log:operate:export'] })
  @OperateLog({ title: '操作日志', businessType: BUSINESS_TYPE.EXPORT })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const dataScopeSQL = this.contextService.getDataScopeSQL(
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysLogOperateService.findByPage(
      query,
      dataScopeSQL
    );
    if (total === 0) {
      return Resp.codeMsg(40016, 'export data record as empty');
    }

    // 导出文件名称
    const fileName = `sys_log_operate_export_${rows.length}_${Date.now()}.xlsx`;
    const ctx = this.contextService.getContext();
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysLogOperateService.exportData(rows, fileName);
  }
}
