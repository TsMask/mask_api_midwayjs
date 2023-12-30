import {
  Controller,
  Inject,
  Get,
  Param,
  Del,
  Post,
  Put,
} from '@midwayjs/core';
import { AccountService } from '../../common/service/AccountService';
import { Result } from '../../../framework/vo/Result';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { parseDateToStr } from '../../../framework/utils/DateUtils';
import { OperateLog } from '../../../framework/decorator/OperateLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysLogLoginServiceImpl } from '../service/impl/SysLogLoginServiceImpl';
import { SysLogLogin } from '../model/SysLogLogin';

/**
 * 系统登录日志信息
 *
 * @author TsMask
 */
@Controller('/system/log/login')
export class SysLogLoginController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysLogLoginService: SysLogLoginServiceImpl;

  @Inject()
  private accountService: AccountService;

  /**
   * 登录访问列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:log:login:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysLogLoginService.selectSysLogLoginPage(query);
    return Result.ok(data);
  }

  /**
   * 登录访问删除
   */
  @Del('/:loginIds')
  @PreAuthorize({ hasPermissions: ['system:log:login:remove'] })
  @OperateLog({
    title: '系统登录信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('loginIds') loginIds: string): Promise<Result> {
    if (!loginIds) return Result.err();
    // 处理字符转id数组
    const ids = loginIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysLogLoginService.deleteSysLogLoginByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 登录访问清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['system:log:login:remove'] })
  @OperateLog({
    title: '系统登录信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async clean(): Promise<Result> {
    const rows = await this.sysLogLoginService.cleanSysLogLogin();
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 登录访问账户解锁
   */
  @Put('/unlock/:userName')
  @PreAuthorize({ hasPermissions: ['system:log:login:unlock'] })
  @OperateLog({
    title: '系统登录信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async unlock(@Param('userName') userName: string): Promise<Result> {
    if (!userName) return Result.err();
    const ok = await this.accountService.clearLoginRecordCache(userName);
    return Result[ok ? 'ok' : 'err']();
  }

  /**
   * 导出系统登录信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:log:login:export'] })
  @OperateLog({
    title: '系统登录信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysLogLoginService.selectSysLogLoginPage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysLogLogin) => {
        pre.push({
          序号: cur.loginId,
          用户账号: cur.userName,
          登录状态: ['失败', '成功'][+cur.status],
          登录地址: cur.ipaddr,
          登录地点: cur.loginLocation,
          浏览器: cur.browser,
          操作系统: cur.os,
          提示消息: cur.msg,
          访问时间: parseDateToStr(+cur.loginTime),
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `sys_log_login_export_${
      data.rows.length
    }_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.excelWriteRecord(rows, fileName);
  }
}
