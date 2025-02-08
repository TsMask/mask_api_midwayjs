import {
  Controller,
  Inject,
  Get,
  Param,
  Del,
  Post,
  Query,
} from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/reqctx/context';
import { SysJobService } from '../service/sys_job';
import { SysJobLogService } from '../service/sys_job_log';

/**调度任务日志信息 控制层处理 */
@Controller('/monitor/jobLog')
export class SysJobLogController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysJobService: SysJobService;

  @Inject()
  private sysJobLogService: SysJobLogService;

  /**
   * 调度任务日志列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:job:list'] })
  async list(@Query() query: Record<string, string>): Promise<Resp> {
    if (query.jobId && query.jobId !== '0') {
      const jobId = parseNumber(query.jobId);
      if (jobId > 0) {
        const job = await this.sysJobService.findById(jobId);
        query.jobName = job.jobName;
        query.jobGroup = job.jobGroup;
      }
    }
    const [rows, total] = await this.sysJobLogService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 调度任务日志信息
   */
  @Get('/:logId')
  @PreAuthorize({ hasPermissions: ['monitor:job:query'] })
  async info(
    @Valid(RuleType.number().required()) @Param('logId') logId: number
  ): Promise<Resp> {
    if (logId <= 0) {
      return Resp.codeMsg(40010, 'bind err: logId is empty');
    }
    const jobLogInfo = await this.sysJobLogService.findById(logId);
    if (jobLogInfo.logId === logId) {
      return Resp.okData(jobLogInfo);
    }
    return Resp.err();
  }

  /**
   * 调度任务日志删除
   */
  @Del('/:logId')
  @PreAuthorize({ hasPermissions: ['monitor:job:remove'] })
  @OperateLog({
    title: '调度任务日志信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  async remove(
    @Valid(RuleType.string().required()) @Param('logId') logId: string
  ): Promise<Resp> {
    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(logId, ',');
    // 转换成number数组类型
    const logIds = uniqueIDs.map(id => parseNumber(id));
    const rows = await this.sysJobLogService.deleteByIds(logIds);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }

  /**
   * 调度任务日志清空
   */
  @Del('/clean')
  @PreAuthorize({ hasPermissions: ['monitor:job:remove'] })
  @OperateLog({
    title: '调度任务日志信息',
    businessType: BUSINESS_TYPE.CLEAN,
  })
  async clean(): Promise<Resp> {
    const rows = await this.sysJobLogService.clean();
    return Resp.okData(rows);
  }

  /**
   * 导出调度任务日志信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['monitor:job:export'] })
  @OperateLog({
    title: '调度任务日志信息',
    businessType: BUSINESS_TYPE.EXPORT,
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysJobLogService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('导出数据记录为空');
    }

    // 导出数据表格
    const fileName = `jobLog_export_${rows.length}_${Date.now()}.xlsx`;
    const ctx = this.contextService.getContext();
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysJobLogService.exportData(rows, fileName);
  }
}
