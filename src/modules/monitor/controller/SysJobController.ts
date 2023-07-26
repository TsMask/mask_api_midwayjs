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
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RepeatSubmit } from '../../../framework/decorator/RepeatSubmitMethodDecorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { Result } from '../../../framework/vo/Result';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import {
  parseCronExpression,
  parseStringToObject,
} from '../../../framework/utils/ValueParseUtils';
import { SysDictDataServiceImpl } from '../../system/service/impl/SysDictDataServiceImpl';
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

  @Inject()
  private sysDictDataService: SysDictDataServiceImpl;

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
    return Result.okData(data);
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
    const {
      jobId,
      jobName,
      jobGroup,
      cronExpression,
      invokeTarget,
      targetParams,
    } = job;
    if (jobId && !jobName && !jobGroup && !cronExpression && !invokeTarget) {
      return Result.err();
    }
    // 检查cron表达式格式
    if (!parseCronExpression(cronExpression)) {
      return Result.errMsg(`调度任务新增【${jobName}】失败，Cron表达式不正确`);
    }
    // 检查属性唯一
    const uniqueJob = await this.sysJobService.checkUniqueJobName(
      jobName,
      jobGroup
    );
    if (!uniqueJob) {
      return Result.errMsg(
        `调度任务新增【${jobName}】失败，同任务组内有相同任务名称`
      );
    }
    // 检查任务调用传入参数是否json格式
    if (targetParams) {
      const msg = `调度任务新增【${jobName}】失败，任务传入参数json字符串不正确`;
      if (targetParams.length < 7) {
        return Result.errMsg(msg);
      }
      const params = parseStringToObject(targetParams);
      if (!params) {
        return Result.errMsg(msg);
      }
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
    const {
      jobId,
      jobName,
      jobGroup,
      cronExpression,
      invokeTarget,
      targetParams,
    } = job;
    if (!jobId && !jobName && !jobGroup && !cronExpression && !invokeTarget) {
      return Result.err();
    }
    // 检查cron表达式格式
    if (!parseCronExpression(cronExpression)) {
      return Result.errMsg(`调度任务修改【${jobName}】失败，Cron表达式不正确`);
    }
    // 检查属性唯一
    const uniqueJob = await this.sysJobService.checkUniqueJobName(
      jobName,
      jobGroup,
      jobId
    );
    if (!uniqueJob) {
      return Result.errMsg(
        `调度任务修改【${jobName}】失败，同任务组内有相同任务名称`
      );
    }
    // 检查任务调用传入参数是否json格式
    if (targetParams) {
      const msg = `调度任务修改【${jobName}】失败，任务传入参数json字符串不正确`;
      if (targetParams.length < 7) {
        return Result.errMsg(msg);
      }
      const params = parseStringToObject(targetParams);
      if (!params) {
        return Result.errMsg(msg);
      }
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
    if (!jobId || status.length > 1) return Result.err();
    const sysJob = await this.sysJobService.selectJobById(jobId);
    if (!sysJob) return Result.err();
    // 与旧值相等不变更
    if (sysJob.status === status) {
      return Result.errMsg("变更状态与旧值相等！")
    }
    sysJob.status = status;
    sysJob.updateBy = this.contextService.getUseName();
    const ok = await this.sysJobService.changeStatus(sysJob);
    return Result[ok ? 'ok' : 'err']();
  }

  /**
   * 调度任务立即执行一次
   */
  @Put('/run/:jobId')
  @RepeatSubmit(10)
  @PreAuthorize({ hasPermissions: ['monitor:job:changeStatus'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async run(@Param('jobId') jobId: string): Promise<Result> {
    if (!jobId) return Result.err();
    const sysJob = await this.sysJobService.selectJobById(jobId);
    if (!sysJob) return Result.err();
    const ok = await this.sysJobService.runQueueJob(sysJob);
    return Result[ok ? 'ok' : 'err']();
  }

  /**
   * 调度任务重置刷新队列
   */
  @Put('/resetQueueJob')
  @RepeatSubmit(5)
  @PreAuthorize({ hasPermissions: ['monitor:job:changeStatus'] })
  @OperLog({
    title: '调度任务信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async resetQueueJob(): Promise<Result> {
    await this.sysJobService.resetQueueJob();
    return Result.ok();
  }

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
    const data = await this.sysJobService.selectJobPage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 读取任务组名字典数据
    const dictSysJobGroup = await this.sysDictDataService.selectDictDataByType(
      'sys_job_group'
    );
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysJob) => {
        const sysJobGroup = dictSysJobGroup.find(
          item => item.dictValue === cur.jobGroup
        );
        pre.push({
          任务编号: cur.jobId,
          任务名称: cur.jobName,
          任务组名: sysJobGroup?.dictLabel ?? '',
          调用目标: cur.invokeTarget,
          传入参数: cur.targetParams,
          执行表达式: cur.cronExpression,
          计划策略: ['立即执行', '执行一次', '放弃执行'][
            +cur.misfirePolicy - 1
          ],
          并发执行: ['禁止', '允许'][+cur.concurrent],
          任务状态: ['暂停', '正常'][+cur.status],
          备注说明: cur.remark,
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `job_export_${data.total}_${Date.now()}.xlsx`;
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
      '调度任务信息',
      fileName
    );
  }
}
