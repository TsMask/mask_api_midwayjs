import { Controller, Del, Get, Inject, Query } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';

import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { loginUserToDataScopeSQL } from '../../../internal/web/reqctx/auth';
import { Resp } from '../../../internal/web/resp/api';
import { SysOperationLogService } from '../service/sys_operation_log';

/**系统操作日志信息 控制层处理 */
@Controller('/api/v1/system/logs/operation')
export class SysOperationLogController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private sysOperationLogService: SysOperationLogService;

  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:operation:log:list'],
      }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const filter = loginUserToDataScopeSQL(this.c, 'sys_user', 'sys_user');
    const [rows, total] = await this.sysOperationLogService.findByPage(
      query,
      filter
    );
    return Resp.okData({ rows: rows, total });
  }

  @Del('/clean', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:operation:log:remove'],
      }),
      OperateLogMiddleware({
        title: '操作日志',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async clean(): Promise<Resp> {
    const rows = await this.sysOperationLogService.clean();
    return Resp.okData(rows);
  }

  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:operation:log:export'],
      }),
      OperateLogMiddleware({
        title: '操作日志',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    const filter = loginUserToDataScopeSQL(this.c, 'sys_user', 'sys_user');
    const [rows, total] = await this.sysOperationLogService.findByPage(
      query,
      filter
    );
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    const fileName = `sys_operation_log_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysOperationLogService.exportData(rows, fileName);
  }
}
