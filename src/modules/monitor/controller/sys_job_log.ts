import { Controller, Inject, Get, Param, Del, Query } from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { Resp } from '../../../framework/resp/api';
import { SysJobLogService } from '../service/sys_job_log';
import { SysJobService } from '../service/sys_job';

/**调度任务日志信息 控制层处理 */
@Controller('/monitor/job/log')
export class SysJobLogController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**调度任务服务 */
  @Inject()
  private sysJobService: SysJobService;

  /**调度任务日志服务 */
  @Inject()
  private sysJobLogService: SysJobLogService;

  /**调度任务日志列表 */
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const jobId = parseNumber(query.jobId);
    if (jobId > 0) {
      const job = await this.sysJobService.findById(jobId);
      query.jobName = job.jobName;
      query.jobGroup = job.jobGroup;
    }
    const [rows, total] = await this.sysJobLogService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**调度任务日志信息 */
  @Get('/:logId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:query'] }),
    ],
  })
  public async info(
    @Valid(RuleType.number()) @Param('logId') logId: number
  ): Promise<Resp> {
    if (logId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: logId is empty');
    }

    const data = await this.sysJobLogService.findById(logId);
    if (data.logId === logId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**调度任务日志删除 */
  @Del('/:logId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:remove'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.string().allow('')) @Param('logId') logId: string
  ): Promise<Resp> {
    if (logId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: logId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(logId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const rows = await this.sysJobLogService.deleteByIds(ids);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }

  /**调度任务日志清空 */
  @Del('/clean', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:remove'] }),
      OperateLogMiddleware({
        title: '调度任务日志信息',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async clean(): Promise<Resp> {
    const rows = await this.sysJobLogService.clean();
    return Resp.okData(rows);
  }

  /**导出调度任务日志信息 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:export'] }),
      OperateLogMiddleware({
        title: '调度任务日志信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const jobId = parseNumber(query.jobId);
    if (jobId > 0) {
      const job = await this.sysJobLogService.findById(jobId);
      query.jobName = job.jobName;
      query.jobGroup = job.jobGroup;
    }
    const [rows, total] = await this.sysJobLogService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出数据表格
    const fileName = `job_log_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysJobLogService.exportData(rows, fileName);
  }
}
