import { Controller, Inject, Get, Param, Del } from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysOperLogServiceImpl } from '../service/impl/SysOperLogServiceImpl';

/**
 * 操作日志记录信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/monitor/operlog')
export class SysOperlogController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysOperLogService: SysOperLogServiceImpl;

  /**
   * 操作日志列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:operlog:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysOperLogService.selectOperLogPage(query);
    return Result.ok(data);
  }

  /**
   * 操作日志删除
   */
  @Del('/:operIds')
  @PreAuthorize({ hasPermissions: ['monitor:operlog:remove'] })
  async remove(@Param('operIds') operIds: string): Promise<Result> {
    if (!operIds) return Result.err();
    // 处理字符转id数组
    const ids = operIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysOperLogService.deleteOperLogByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 操作日志清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['monitor:operlog:remove'] })
  async clean(): Promise<Result> {
    const rows = await this.sysOperLogService.cleanOperLog();
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
