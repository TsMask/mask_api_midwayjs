import {
  Controller,
  Inject,
  Get,
  Param,
  Del,
  Put,
  Query,
} from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import { Resp } from '../../../framework/resp/api';
import { loginUserToDataScopeSQL } from '../../../framework/reqctx/auth';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { AccountService } from '../../common/service/account';
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

  /**账号身份操作服务 */
  @Inject()
  private accountService: AccountService;

  /**系统登录日志列表 */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:log:login:list'] })
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
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['system:log:login:remove'] })
  @OperateLog({
    title: '系统登录信息',
    businessType: BUSINESS_TYPE.CLEAN,
  })
  public async clean(): Promise<Resp> {
    const rows = await this.sysLogLoginService.clean();
    return Resp.okData(rows);
  }

  /**系统登录日志账户解锁 */
  @Put('/unlock/:userName')
  @PreAuthorize({ hasPermissions: ['system:log:login:unlock'] })
  @OperateLog({
    title: '系统登录信息',
    businessType: BUSINESS_TYPE.CLEAN,
  })
  public async unlock(
    @Valid(RuleType.string()) @Param('userName') userName: string
  ): Promise<Resp> {
    if (!userName) {
      this.c.status = 400;
      return Resp.codeMsg(40010, 'bind err: userName is empty');
    }
    const ok = await this.accountService.clearLoginRecordCache(userName);
    if (ok) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**导出系统登录日志信息 */
  @Get('/export')
  @PreAuthorize({ hasPermissions: ['system:log:login:export'] })
  @OperateLog({
    title: '系统登录信息',
    businessType: BUSINESS_TYPE.EXPORT,
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
      return Resp.codeMsg(40016, 'export data record as empty');
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
