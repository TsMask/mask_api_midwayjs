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

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import {
  parseCronExpression,
  parseNumber,
  parseRemoveDuplicatesToArray,
  parseStringToObject,
} from '../../../framework/utils/ValueParseUtils';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RepeatSubmit } from '../../../framework/decorator/RepeatSubmitMethodDecorator';
import { Resp } from '../../../framework/resp/api';
import { ContextService } from '../../../framework/service/ContextService';
import { SysJob } from '../model/sys_job';
import { SysJobService } from '../service/sys_job';

/**调度任务信息 控制层处理*/
@Controller('/monitor/job')
export class SysJobController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysJobService: SysJobService;

  /**
   * 调度任务列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:job:list'] })
  async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysJobService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 调度任务信息
   */
  @Get('/:jobId')
  @PreAuthorize({ hasPermissions: ['monitor:job:query'] })
  async info(
    @Valid(RuleType.number().required()) @Param('jobId') jobId: number
  ): Promise<Resp> {
    const data = await this.sysJobService.findById(jobId);
    return Resp.okData(data);
  }

  /**
   * 调度任务新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['monitor:job:add'] })
  @OperateLog({
    title: '调度任务信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  public async add(@Body() body: SysJob): Promise<Resp> {
    if (body.jobId === undefined || body.jobId > 0) {
      return Resp.codeMsg(40010, 'bind err: jobId not is empty');
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

    body.createBy = this.contextService.getUseName();
    const insertId = await this.sysJobService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**
   * 调度任务修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['monitor:job:edit'] })
  @OperateLog({
    title: '调度任务信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async edit(@Body() body: SysJob): Promise<Resp> {
    if (body.jobId === undefined || body.jobId <= 0) {
      return Resp.codeMsg(40010, 'bind err: jobId is empty');
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
    if (jobInfo.jobId != body.jobId) {
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
    jobInfo.updateBy = this.contextService.getUseName();
    const rows = await this.sysJobService.update(jobInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 调度任务删除
   */
  @Del('/:jobId')
  @PreAuthorize({ hasPermissions: ['monitor:job:remove'] })
  @OperateLog({
    title: '调度任务信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  async remove(
    @Valid(RuleType.string().required()) @Param('jobId') jobId: string
  ): Promise<Resp> {
    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(jobId, ',');
    // 转换成number数组类型
    const jobIds = uniqueIDs.map(id => parseNumber(id));
    const rows = await this.sysJobService.deleteByIds(jobIds);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }

  /**
   * 调度任务修改状态
   */
  @Put('/status')
  @RepeatSubmit(5)
  @PreAuthorize({ hasPermissions: ['monitor:job:status'] })
  @OperateLog({
    title: '调度任务信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  async status(
    @Valid(RuleType.number().required()) @Body('jobId') jobId: number,
    @Valid(
      RuleType.string()
        .required()
        .pattern(/^[01]$/)
    )
    @Body('status')
    status: string
  ): Promise<Resp> {
    // 检查是否存在
    const jobInfo = await this.sysJobService.findById(jobId);
    if (jobInfo.jobId !== jobId) {
      return Resp.errMsg('没有权限访问调度任务数据！');
    }
    // 与旧值相等不变更
    if (jobInfo.statusFlag === status) {
      return Resp.errMsg('变更状态与旧值相等！');
    }
    jobInfo.statusFlag = status;
    jobInfo.updateBy = this.contextService.getUseName();
    const rows = await this.sysJobService.update(jobInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 调度任务立即执行一次
   */
  @Put('/run/:jobId')
  @RepeatSubmit(10)
  @PreAuthorize({ hasPermissions: ['monitor:job:status'] })
  @OperateLog({
    title: '调度任务信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  async run(
    @Valid(RuleType.number().required()) @Param('jobId') jobId: number
  ): Promise<Resp> {
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

  /**
   * 调度任务重置刷新队列
   */
  @Put('/reset')
  @RepeatSubmit(5)
  @PreAuthorize({ hasPermissions: ['monitor:job:status'] })
  @OperateLog({
    title: '调度任务信息',
    businessType: BUSINESS_TYPE.CLEAN,
  })
  async reset(): Promise<Resp> {
    await this.sysJobService.reset();
    return Resp.ok();
  }

  /**
   * 导出调度任务信息
   */
  @Get('/export')
  @PreAuthorize({ hasPermissions: ['monitor:job:export'] })
  @OperateLog({
    title: '调度任务信息',
    businessType: BUSINESS_TYPE.EXPORT,
  })
  async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysJobService.findByPage(query);
    if (total === 0) {
      return Resp.codeMsg(40016, 'export data record as empty');
    }

    // 导出文件名称
    const fileName = `job_export_${rows.length}_${Date.now()}.xlsx`;
    const ctx = this.contextService.getContext();
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysJobService.exportData(rows, fileName);
  }
}
