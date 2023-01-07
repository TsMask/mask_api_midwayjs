import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SysJobLog } from '../../model/SysJobLog';
import { SysJobLogRepositoryImpl } from '../../repository/impl/SysJobLogRepositoryImpl';
import { ISysJobLogService } from '../ISysJobLogService';

/**
 * 定时任务调度日志信息 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysJobLogServiceImpl implements ISysJobLogService {
  @Inject()
  private sysJobLogRepository: SysJobLogRepositoryImpl;

  async selectJobLogPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysJobLogRepository.selectJobLogPage(query);
  }
  async selectJobLogList(sysJobLog: SysJobLog): Promise<SysJobLog[]> {
    return await this.sysJobLogRepository.selectJobLogList(sysJobLog);
  }
  async selectJobLogById(jobLogId: string): Promise<SysJobLog> {
    return await this.sysJobLogRepository.selectJobLogById(jobLogId);
  }
  async insertJobLog(sysJobLog: SysJobLog): Promise<string> {
    return await this.sysJobLogRepository.insertJobLog(sysJobLog);
  }
  async deleteJobLogByIds(jobLogId: string[]): Promise<number> {
    return await this.sysJobLogRepository.deleteJobLogByIds(jobLogId);
  }
  async cleanJobLog(): Promise<number> {
    return await this.sysJobLogRepository.cleanJobLog();
  }
}
