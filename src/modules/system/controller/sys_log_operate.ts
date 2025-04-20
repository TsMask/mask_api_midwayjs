import { Controller, Inject, Get, Del, Query } from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { loginUserToDataScopeSQL } from '../../../framework/reqctx/auth';
import { Resp } from '../../../framework/resp/api';
import { SysLogOperateService } from '../service/sys_log_operate';

/**操作日志记录信息 控制层处理 */
@Controller('/system/log/operate')
export class SysLogOperateController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**操作日志服务 */
  @Inject()
  private sysLogOperateService: SysLogOperateService;

  /**操作日志列表 */
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:log:operate:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const dataScopeSQL = loginUserToDataScopeSQL(
      this.c,
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysLogOperateService.findByPage(
      query,
      dataScopeSQL
    );
    return Resp.okData({ rows, total });
  }

  /**操作日志清空 */
  @Del('/clean', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:log:operate:remove'] }),
      OperateLogMiddleware({
        title: '操作日志',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async clean(): Promise<Resp> {
    const rows = await this.sysLogOperateService.clean();
    return Resp.okData(rows);
  }

  /**导出操作日志 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:log:operate:export'] }),
      OperateLogMiddleware({
        title: '操作日志',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const dataScopeSQL = loginUserToDataScopeSQL(
      this.c,
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysLogOperateService.findByPage(
      query,
      dataScopeSQL
    );
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `sys_log_operate_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysLogOperateService.exportData(rows, fileName);
  }
}
