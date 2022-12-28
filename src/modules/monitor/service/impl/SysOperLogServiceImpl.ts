import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SysOperLog } from '../../model/SysOperLog';
import { SysOperLogRepositoryImpl } from '../../repository/impl/SysOperLogRepositoryImpl';
import { ISysOperLogService } from '../ISysOperLogService';

/**
 * 操作日志 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysOperLogServiceImpl implements ISysOperLogService {
  @Inject()
  private sysOperLogRepository: SysOperLogRepositoryImpl;

  async selectOperLogPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysOperLogRepository.selectOperLogPage(query);
  }

  async selectOperLogById(operId: string): Promise<SysOperLog> {
    return await this.sysOperLogRepository.selectOperLogById(operId);
  }

  async selectOperLogList(sysOperLog: SysOperLog): Promise<SysOperLog[]> {
    return await this.sysOperLogRepository.selectOperLogList(sysOperLog);
  }

  async insertOperLog(sysOperLog: SysOperLog): Promise<string> {
    return await this.sysOperLogRepository.insertOperLog(sysOperLog);
  }

  async deleteOperLogByIds(operIds: string[]): Promise<number> {
    return await this.sysOperLogRepository.deleteOperLogByIds(operIds);
  }

  async cleanOperLog(): Promise<number> {
    return await this.sysOperLogRepository.cleanOperLog();
  }
}
