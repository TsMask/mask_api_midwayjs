import { Controller, Inject, Get, Param, Del, Post } from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../common/enums/OperatorBusinessTypeEnum';
import { parseDateToStr } from '../../../common/utils/DateFnsUtils';
import { Result } from '../../../framework/core/Result';
import { OperLog } from '../../../framework/decorator/OperLogDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysLoginService } from '../../../framework/service/SysLoginService';
import { SysLogininfor } from '../model/SysLogininfor';
import { SysLogininforServiceImpl } from '../service/impl/SysLogininforServiceImpl';

/**
 * 系统访问记录信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/monitor/logininfor')
export class SysLogininforController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysLogininforService: SysLogininforServiceImpl;

  @Inject()
  private sysLoginService: SysLoginService;

  /**
   * 导出系统访问记录信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:logininfor:export'] })
  @OperLog({
    title: '系统访问记录信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    ctx.request.body.pageNum = 1;
    ctx.request.body.pageSize = 1000;
    const data = await this.sysLogininforService.selectLogininforPage(
      ctx.request.body
    );
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysLogininfor) => {
        pre.push({
          序号: cur.infoId,
          用户账号: cur.userName,
          登录状态: cur.status === '0' ? '正常' : '异常',
          登录地址: cur.ipaddr,
          登录地点: cur.loginLocation,
          浏览器: cur.browser,
          操作系统: cur.os,
          提示消息: cur.msg,
          访问时间: parseDateToStr(new Date(+cur.loginTime)),
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `logininfor_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.writeExcelFile(
      rows,
      '系统访问记录信息',
      fileName
    );
  }

  /**
   * 系统访问记录列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysLogininforService.selectLogininforPage(query);
    return Result.ok(data);
  }

  /**
   * 系统访问记录删除
   */
  @Del('/:infoIds')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:remove'] })
  @OperLog({
    title: '系统访问记录信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('infoIds') infoIds: string): Promise<Result> {
    if (!infoIds) return Result.err();
    // 处理字符转id数组
    const ids = infoIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysLogininforService.deleteLogininforByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 系统访问记录清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:remove'] })
  @OperLog({
    title: '系统访问记录信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async clean(): Promise<Result> {
    const rows = await this.sysLogininforService.cleanLogininfor();
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 账户解锁
   */
  @Del('/unlock/:userName')
  @PreAuthorize({ hasPermissions: ['monitor:logininfor:unlock'] })
  @OperLog({ title: '账户解锁', businessType: OperatorBusinessTypeEnum.CLEAN })
  async unlock(@Param('userName') userName: string): Promise<Result> {
    if (!userName) return Result.err();
    const ok = await this.sysLoginService.clearLoginRecordCache(userName);
    return Result[ok ? 'ok' : 'err']();
  }
}
