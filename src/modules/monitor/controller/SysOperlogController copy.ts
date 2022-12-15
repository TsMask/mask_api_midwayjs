import { Controller, Inject, Get, Param, Del } from '@midwayjs/decorator';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysLogininforServiceImpl } from '../service/impl/SysLogininforServiceImpl';

/**
 * 系统访问记录信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/monitor/logininfor')
export class SysOperlogController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysLogininforService: SysLogininforServiceImpl;

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
  async clean(): Promise<Result> {
    const rows = await this.sysLogininforService.cleanLogininfor();
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
