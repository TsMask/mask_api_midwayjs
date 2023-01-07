import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/decorator';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { Result } from '../../../framework/model/Result';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysJob } from '../model/SysJob';
import { SysJobServiceImpl } from '../service/impl/SysJobServiceImpl';

/**
 * 调度任务信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller("/monitor/job")
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
    ctx.request.body.pageNum = 1;
    ctx.request.body.pageSize = 1000;
    const data = await this.sysJobService.selectJobPage(
      ctx.request.body
    );
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysJob) => {
        pre.push({
          任务ID: cur.jobId,
          任务名称: cur.jobName,
          任务组名: cur.jobGroup,
          状态: cur.status === '0' ? '正常' : '停用',
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
    if (!job.jobName) return Result.err();
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
    if (!job.jobName) return Result.err();
    job.updateBy = this.contextService.getUseName();
    const rows = await this.sysJobService.updateJob(job);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 调度任务删除
   */
  @Del('/:jobIds')
  @PreAuthorize({ hasPermissions: ['onitor:job:remove'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('jobIds') jobIds: string): Promise<Result> {
    if (!jobIds) return Result.err();
    // 处理字符转id数组
    const ids = jobIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysJobService.deleteJobByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 调度任务修改状态
   */
  @Put("/changeStatus")
  @PreAuthorize({ hasPermissions: ['monitor:job:changeStatus'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async changeStatus(@Body("jobId") jobId: string, @Body("status") status: string): Promise<Result> {
    if (!jobId) return Result.err();
    const sysJob = await this.sysJobService.selectJobById(jobId);
    if (!sysJob) return Result.err();
    sysJob.status = status;
    sysJob.updateBy = this.contextService.getUseName();
    const ok = await this.sysJobService.changeStatus(sysJob);
    return Result[ok ? 'ok' : 'err']();
  }

  /**
   * 调度任务立即执行一次
   */
  @Put("/:jobId/run")
  @PreAuthorize({ hasPermissions: ['monitor:job:changeStatus'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async run(@Param("jobId") jobId: string): Promise<Result> {
    if (!jobId) return Result.err();
    const sysJob = await this.sysJobService.selectJobById(jobId);
    if (!sysJob) return Result.err();
    const ok = await this.sysJobService.runJob(sysJob);
    return Result[ok ? 'ok' : 'err']();
  }
}
