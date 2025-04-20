import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  parseCronExpression,
  parseNumber,
  parseRemoveDuplicatesToArray,
  parseStringToObject,
} from '../../../framework/utils/parse/parse';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { RepeatSubmitMiddleware } from '../../../framework/middleware/repeat_submit';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { loginUserToUserName } from '../../../framework/reqctx/auth';
import { Resp } from '../../../framework/resp/api';
import { SysJobService } from '../service/sys_job';
import { SysJob } from '../model/sys_job';

/**调度任务信息 控制层处理*/
@Controller('/monitor/job')
export class SysJobController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**调度任务服务 */
  @Inject()
  private sysJobService: SysJobService;

  /**调度任务列表 */
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysJobService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**调度任务信息 */
  @Get('/:jobId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:query'] }),
    ],
  })
  public async info(
    @Valid(RuleType.number()) @Param('jobId') jobId: number
  ): Promise<Resp> {
    if (jobId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: jobId not is empty');
    }
    const jobInfo = await this.sysJobService.findById(jobId);
    if (jobInfo.jobId === jobId) {
      return Resp.okData(jobInfo);
    }
    return Resp.err();
  }

  /**调度任务新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:add'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysJob): Promise<Resp> {
    if (body.jobId > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: jobId not is empty');
    }

    // 检查cron表达式格式
    if (parseCronExpression(body.cronExpression) === 0) {
      return Resp.errMsg(
        `调度任务新增【${body.jobName}】失败，Cron表达式不正确`
      );
    }

    // 检查任务调用传入参数是否json格式
    if (body.targetParams !== '') {
      const msg = `调度任务新增【${body.jobName}】失败，任务传入参数json字符串不正确`;
      if (body.targetParams.length < 7) {
        return Resp.errMsg(msg);
      }
      const params = parseStringToObject(body.targetParams);
      if (!params) {
        return Resp.errMsg(msg);
      }
    }

    // 检查属性唯一
    const uniqueJob = await this.sysJobService.checkUniqueJobName(
      body.jobName,
      body.jobGroup,
      0
    );
    if (!uniqueJob) {
      return Resp.errMsg(
        `调度任务新增【${body.jobName}】失败，同任务组内有相同任务名称`
      );
    }

    body.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysJobService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**调度任务修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:edit'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysJob): Promise<Resp> {
    if (body.jobId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: jobId is empty');
    }

    // 检查cron表达式格式
    if (parseCronExpression(body.cronExpression) === 0) {
      return Resp.errMsg(
        `调度任务修改【${body.jobName}】失败，Cron表达式不正确`
      );
    }

    // 检查任务调用传入参数是否json格式
    if (body.targetParams) {
      const msg = `调度任务修改【${body.jobName}】失败，任务传入参数json字符串不正确`;
      if (body.targetParams.length < 7) {
        return Resp.errMsg(msg);
      }
      const params = parseStringToObject(body.targetParams);
      if (!params) {
        return Resp.errMsg(msg);
      }
    }

    // 检查属性唯一
    const uniqueJob = await this.sysJobService.checkUniqueJobName(
      body.jobName,
      body.jobGroup,
      body.jobId
    );
    if (!uniqueJob) {
      return Resp.errMsg(
        `调度任务修改【${body.jobName}】失败，同任务组内有相同任务名称`
      );
    }

    // 检查是否存在
    const jobInfo = await this.sysJobService.findById(body.jobId);
    if (jobInfo.jobId !== body.jobId) {
      return Resp.errMsg('没有权限访问调度任务数据！');
    }

    jobInfo.jobName = body.jobName;
    jobInfo.jobGroup = body.jobGroup;
    jobInfo.invokeTarget = body.invokeTarget;
    jobInfo.targetParams = body.targetParams;
    jobInfo.cronExpression = body.cronExpression;
    jobInfo.misfirePolicy = body.misfirePolicy;
    jobInfo.concurrent = body.concurrent;
    jobInfo.statusFlag = body.statusFlag;
    jobInfo.saveLog = body.saveLog;
    jobInfo.remark = body.remark;
    jobInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysJobService.update(jobInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**调度任务删除 */
  @Del('/:jobId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:remove'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.string().allow('')) @Param('jobId') jobId: string
  ): Promise<Resp> {
    if (jobId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: jobId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(jobId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysJobService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }

  /**调度任务修改状态 */
  @Put('/status', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:status'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async status(
    @Valid(RuleType.number().required()) @Body('jobId') jobId: number,
    @Valid(
      RuleType.string()
        .required()
        .pattern(/^[01]$/)
    )
    @Body('statusFlag')
    statusFlag: string
  ): Promise<Resp> {
    // 检查是否存在
    const jobInfo = await this.sysJobService.findById(jobId);
    if (jobInfo.jobId !== jobId) {
      return Resp.errMsg('没有权限访问调度任务数据！');
    }
    // 与旧值相等不变更
    if (jobInfo.statusFlag === statusFlag) {
      return Resp.errMsg('变更状态与旧值相等！');
    }
    jobInfo.statusFlag = statusFlag;
    jobInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysJobService.update(jobInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**调度任务立即执行一次 */
  @Put('/run/:jobId', {
    middleware: [
      RepeatSubmitMiddleware(10),
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:status'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async run(
    @Valid(RuleType.number()) @Param('jobId') jobId: number
  ): Promise<Resp> {
    if (jobId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: jobId is empty');
    }

    // 检查是否存在
    const jobInfo = await this.sysJobService.findById(jobId);
    if (jobInfo.jobId !== jobId) {
      return Resp.errMsg('没有权限访问调度任务数据！');
    }
    // 执行一次调度任务
    const ok = await this.sysJobService.run(jobInfo);
    if (ok) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**调度任务重置刷新队列 */
  @Put('/reset', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:status'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async reset(): Promise<Resp> {
    await this.sysJobService.reset();
    return Resp.ok();
  }

  /**
   * 导出调度任务信息
   */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['monitor:job:export'] }),
      OperateLogMiddleware({
        title: '调度任务信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysJobService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `job_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysJobService.exportData(rows, fileName);
  }
}
