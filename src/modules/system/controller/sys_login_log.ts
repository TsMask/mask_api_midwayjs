import { Controller, Del, Get, Inject, Query } from '@midwayjs/core';
import type { Context } from '@midwayjs/koa';

import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { loginUserToDataScopeSQL } from '../../../internal/web/reqctx/auth';
import { Resp } from '../../../internal/web/resp/api';
import { SysLoginLogService } from '../service/sys_login_log';

/**系统登录日志信息 控制层处理 */
@Controller('/api/v1/system/logs/login')
export class SysLoginLogController {
  @Inject('ctx')
  private c: Context;

  @Inject()
  private sysLoginLogService: SysLoginLogService;

  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:login:log:list'],
      }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const filter = loginUserToDataScopeSQL(this.c, 'sys_user', 'sys_user');
    const [rows, total] = await this.sysLoginLogService.findByPage(
      query,
      filter
    );
    return Resp.okData({ rows: rows, total });
  }

  @Del('/clean', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:login:log:remove'],
      }),
      OperateLogMiddleware({
        title: '系统登录信息',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async clean(): Promise<Resp> {
    const rows = await this.sysLoginLogService.clean();
    return Resp.okData(rows);
  }

  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({
        hasPerms: ['system:login:log:export'],
      }),
      OperateLogMiddleware({
        title: '系统登录信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    const filter = loginUserToDataScopeSQL(this.c, 'sys_user', 'sys_user');
    const [rows, total] = await this.sysLoginLogService.findByPage(
      query,
      filter
    );
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    const fileName = `sys_login_log_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysLoginLogService.exportData(rows, fileName);
  }
}
