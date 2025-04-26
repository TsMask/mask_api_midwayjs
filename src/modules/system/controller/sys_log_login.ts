import {
  Controller,
  Inject,
  Get,
  Del,
  Query,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { loginUserToDataScopeSQL } from '../../../framework/reqctx/auth';
import { Resp } from '../../../framework/resp/api';
import { SysLogLoginService } from '../service/sys_log_login';

/**系统登录日志信息 控制层处理 */
@Controller('/system/log/login')
export class SysLogLoginController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**系统登录日志服务 */
  @Inject()
  private sysLogLoginService: SysLogLoginService;

  /**系统登录日志列表 */
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:log:login:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const dataScopeSQL = loginUserToDataScopeSQL(
      this.c,
      'sys_user',
      'sys_user'
    );
    const [rows, total] = await this.sysLogLoginService.findByPage(
      query,
      dataScopeSQL
    );
    return Resp.okData({ rows, total });
  }

  /**系统登录日志清空 */
  @Del('/clean', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:log:login:remove'] }),
      OperateLogMiddleware({
        title: '系统登录信息',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async clean(): Promise<Resp> {
    const rows = await this.sysLogLoginService.clean();
    return Resp.okData(rows);
  }

  /**导出系统登录日志信息 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:log:login:export'] }),
      OperateLogMiddleware({
        title: '系统登录信息',
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
    const [rows, total] = await this.sysLogLoginService.findByPage(
      query,
      dataScopeSQL
    );
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `sys_log_login_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysLogLoginService.exportData(rows, fileName);
  }
}
