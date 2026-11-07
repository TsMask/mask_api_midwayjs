import { Controller, Inject, Get, Param, Del, Query } from '@midwayjs/core';
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../internal/shared/parse/parse';
import { RepeatSubmitMiddleware } from '../../../internal/web/middleware/repeat_submit';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { SysJobLogService } from '../service/sys_job_log';
import { SysJobService } from '../service/sys_job';

/**调度任务日志信息 控制层处理 */
@Controller('/api/v1/job/logs')
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
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:log:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const jobId = parseNumber(query.id);
    if (jobId > 0) {
      const job = await this.sysJobService.findById(jobId);
      if (job.id !== jobId) {
        this.c.status = 422;
        return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id no found');
      }
      query.job_name = job.job_name;
      query.job_group = job.job_group;
    }
    const [rows, total] = await this.sysJobLogService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**导出调度任务日志信息 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:log:export'] }),
      OperateLogMiddleware({
        title: '调度任务日志信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const jobId = parseNumber(query.id);
    if (jobId > 0) {
      const job = await this.sysJobService.findById(jobId);
      query.job_name = job.job_name;
      query.job_group = job.job_group;
    }
    const [rows, total] = await this.sysJobLogService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出数据表格
    const fileName = `job_log_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysJobLogService.exportData(rows, fileName);
  }

  /**调度任务日志信息 */
  @Get('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:log:query'] }),
    ],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') logId: number
  ): Promise<Resp> {
    if (logId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: logId is empty');
    }

    const data = await this.sysJobLogService.findById(logId);
    if (data.id === logId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**调度任务日志清空 */
  @Del('/clean', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:log:remove'] }),
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

  /**调度任务日志删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:log:remove'] }),
      OperateLogMiddleware({
        title: '调度任务日志信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.string().allow('')) @Param('id') logId: string
  ): Promise<Resp> {
    if (logId === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: logId is empty');
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
}
