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
} from '@midwayjs/decorator';
import { Result } from '../../../framework/vo/Result';
import { SysJobLogService } from '../service/sys_job_log.service';
import { ContextService } from '../../../framework/service/ContextService';
import { SysJobLog } from '../model/sys_job_log.entity';

/**
 * 演示-TypeORM基本使用
 *
 * 更多功能需要查阅 http://www.midwayjs.org/docs/extensions/orm
 * @author TsMask
 */
@Controller('/demo-typeorm')
export class SysJobLogController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysJobLogService: SysJobLogService;

  /**
   * 调度任务日志列表分页jobName
   */
  @Get('/list')
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    if (!query.pageSize && !query.pageNum) return Result.err();
    const data = await this.sysJobLogService.selectJobLogPage(query);
    return Result.ok(data);
  }

  /**
   * 调度任务日志列表全表jobName
   */
  @Get('/all')
  async all(@Query('jobName') jobName: string): Promise<Result> {
    const sysJobLog = new SysJobLog();
    if (jobName) {
      sysJobLog.jobName = jobName;
    }
    const data = await this.sysJobLogService.selectJobLogList(sysJobLog);
    return Result.okData(data);
  }

  /**
   * 调度任务日志信息
   */
  @Get('/:jobLogId')
  async getInfo(@Param('jobLogId') jobLogId: string): Promise<Result> {
    if (!jobLogId) return Result.err();
    const data = await this.sysJobLogService.selectJobLogById(jobLogId);
    return Result.okData(data);
  }

  /**
   * 调度任务日志信息新增
   */
  @Post('/')
  async add(@Body() sysJobLog: SysJobLog): Promise<Result> {
    if (sysJobLog.jobLogId) return Result.err();
    const data = await this.sysJobLogService.insertJobLog(sysJobLog);
    return Result.okData(data);
  }

  /**
   *调度任务日志信息更新
   */
  @Put('/')
  async update(@Body() sysJobLog: SysJobLog): Promise<Result> {
    if (!sysJobLog.jobLogId || !sysJobLog.jobName) return Result.err();
    const data = await this.sysJobLogService.updateJobLog(sysJobLog);
    return Result.okData(data);
  }

  /**
   * 调度任务日志删除
   */
  @Del('/:jobLogIds')
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
  async clean(): Promise<Result> {
    const rows = await this.sysJobLogService.cleanJobLog();
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
