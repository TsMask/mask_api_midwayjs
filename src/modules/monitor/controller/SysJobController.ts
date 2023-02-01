import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@midwayjs/decorator';
import { STATUS_YES } from '../../../framework/constants/CommonConstants';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RepeatSubmit } from '../../../framework/decorator/RepeatSubmitMethodDecorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { Result } from '../../../framework/model/Result';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import {
  parseCronExpression,
  parseNumber,
} from '../../../framework/utils/ValueParseUtils';
import { SysJob } from '../model/SysJob';
import { SysJobServiceImpl } from '../service/impl/SysJobServiceImpl';

/**
 * 调度任务信息
 *
 * @author TsMask
 */
@Controller('/monitor/job')
export class SysJobController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysJobService: SysJobServiceImpl;

  /**
   * 导出调度任务信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['monitor:job:export'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    query.pageNum = 1;
    query.pageSize = 1000;
    const data = await this.sysJobService.selectJobPage(query);
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysJob) => {
        pre.push({
          任务序号: cur.jobId,
          任务名称: cur.jobName,
          任务组名: cur.jobGroup,
          调用目标字符串: cur.invokeTarget,
          调用目标传入参数: cur.targetParams,
          执行表达式: cur.cronExpression,
          计划策略: cur.misfirePolicy,
          并发执行: cur.concurrent === STATUS_YES ? '允许' : '禁止',
          任务状态: cur.status === STATUS_YES ? '正常' : '停用',
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `job_export_${rows.length}_${Date.now()}.xlsx`;
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
      '调度任务信息',
      fileName
    );
  }

  /**
   * 调度任务列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['monitor:job:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysJobService.selectJobPage(query);
    return Result.ok(data);
  }

  /**
   * 调度任务信息
   */
  @Get('/:jobId')
  @PreAuthorize({ hasPermissions: ['monitor:job:query'] })
  async getInfo(@Param('jobId') jobId: string): Promise<Result> {
    if (!jobId) return Result.err();
    const data = await this.sysJobService.selectJobById(jobId);
    return Result.okData(data || {});
  }

  /**
   * 调度任务新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['monitor:job:add'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() job: SysJob): Promise<Result> {
    const jobName = job.jobName;
    const cron = job.cronExpression;
    const target = job.invokeTarget;
    if (!jobName && !cron && !target) return Result.err();
    if (parseCronExpression(cron) <= 0) {
      return Result.errMsg(`调度任务新增【${jobName}】失败，Cron表达式不正确`);
    }
    job.createBy = this.contextService.getUseName();
    const insertId = await this.sysJobService.insertJob(job);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 调度任务修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['monitor:job:edit'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() job: SysJob): Promise<Result> {
    const jobName = job.jobName;
    const cron = job.cronExpression;
    const target = job.invokeTarget;
    if (!jobName && !cron && !target) return Result.err();
    if (parseCronExpression(cron) <= 0) {
      return Result.errMsg(`调度任务修改【${jobName}】失败，Cron表达式不正确`);
    }
    job.updateBy = this.contextService.getUseName();
    const rows = await this.sysJobService.updateJob(job);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 调度任务删除
   */
  @Del('/:jobIds')
  @PreAuthorize({ hasPermissions: ['monitor:job:remove'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('jobIds') jobIds: string): Promise<Result> {
    if (!jobIds) return Result.err();
    // 处理字符转id数组
    const ids = jobIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysJobService.deleteJobByIds([...new Set(ids)]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 调度任务修改状态
   */
  @Put('/changeStatus')
  @RepeatSubmit(5)
  @PreAuthorize({ hasPermissions: ['monitor:job:changeStatus'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async changeStatus(
    @Body('jobId') jobId: string,
    @Body('status') status: string
  ): Promise<Result> {
    if (!jobId) return Result.err();
    const sysJob = await this.sysJobService.selectJobById(jobId);
    if (!sysJob) return Result.err();
    // 解析为数值字符串
    status = `${parseNumber(status)}`;
    if (sysJob.status === status) return Result.err();

    sysJob.status = status;
    sysJob.updateBy = this.contextService.getUseName();
    const ok = await this.sysJobService.changeStatus(sysJob);
    return Result[ok ? 'ok' : 'err']();
  }

  /**
   * 调度任务立即执行一次
   */
  @Put('/run')
  @RepeatSubmit(10)
  @PreAuthorize({ hasPermissions: ['monitor:job:changeStatus'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async run(@Body('jobId') jobId: string): Promise<Result> {
    if (!jobId) return Result.err();
    const sysJob = await this.sysJobService.selectJobById(jobId);
    if (!sysJob) return Result.err();
    const ok = await this.sysJobService.runQueueJob(sysJob);
    if (ok) return Result.ok();
    return Result.errMsg('任务已在执行中，请稍后再试！');
  }

  /**
   * 调度任务刷新配置
   */
  @Del('/refreshQueueJob')
  @RepeatSubmit(5)
  @PreAuthorize({ hasPermissions: ['monitor:job:remove'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async refreshCache(): Promise<Result> {
    await this.sysJobService.resetQueueJob();
    return Result.ok();
  }
}