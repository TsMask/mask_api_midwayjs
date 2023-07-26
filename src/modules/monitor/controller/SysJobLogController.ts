import { Controller, Inject, Get, Param, Del, Post } from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { parseDateToStr } from '../../../framework/utils/DateUtils';
import { Result } from '../../../framework/vo/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysJobLogServiceImpl } from '../service/impl/SysJobLogServiceImpl';
import { SysJobLog } from '../model/SysJobLog';
import { SysDictDataServiceImpl } from '../../system/service/impl/SysDictDataServiceImpl';

/**
 * 调度任务日志信息
 *
 * @author TsMask
 */
@Controller('/monitor/jobLog')
export class SysJobLogController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysJobLogService: SysJobLogServiceImpl;

  @Inject()
  private sysDictDataService: SysDictDataServiceImpl;

  /**
   * 调度任务日志列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:job:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysJobLogService.selectJobLogPage(query);
    return Result.ok(data);
  }

  /**
   * 调度任务日志信息
   */
  @Get('/:jobLogId')
  @PreAuthorize({ hasPermissions: ['monitor:job:query'] })
  async getInfo(@Param('jobLogId') jobLogId: string): Promise<Result> {
    if (!jobLogId) return Result.err();
    const data = await this.sysJobLogService.selectJobLogById(jobLogId);
    return Result.okData(data);
  }

  /**
   * 调度任务日志删除
   */
  @Del('/:jobLogIds')
  @PreAuthorize({ hasPermissions: ['monitor:job:remove'] })
  @OperLog({
    title: '调度任务日志信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('jobLogIds') jobLogIds: string): Promise<Result> {
    if (!jobLogIds) return Result.err();
    // 处理字符转id数组
    const ids = jobLogIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysJobLogService.deleteJobLogByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 调度任务日志清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['monitor:job:remove'] })
  @OperLog({
    title: '调度任务日志信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async clean(): Promise<Result> {
    const rows = await this.sysJobLogService.cleanJobLog();
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 导出调度任务日志信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['monitor:job:export'] })
  @OperLog({
    title: '调度任务日志信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysJobLogService.selectJobLogPage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 读取任务组名字典数据
    const dictSysJobGroup = await this.sysDictDataService.selectDictDataByType(
      'sys_job_group'
    );
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysJobLog) => {
        const sysJobGroup = dictSysJobGroup.find(
          item => item.dictValue === cur.jobGroup
        );
        pre.push({
          日志序号: cur.jobLogId,
          任务名称: cur.jobName,
          任务组名: sysJobGroup.dictLabel ?? '',
          调用目标: cur.invokeTarget,
          传入参数: cur.targetParams,
          日志信息: cur.jobMsg,
          执行状态: ['失败', '成功'][+cur.status],
          记录时间: parseDateToStr(+cur.createTime),
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `jobLog_export_${data.total}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.excelWriteRecord(
      rows,
      '调度任务日志信息',
      fileName
    );
  }
}
