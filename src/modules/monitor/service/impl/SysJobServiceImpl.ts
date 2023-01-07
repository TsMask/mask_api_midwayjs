import { Provide, Inject, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SysJob } from '../../model/SysJob';
import { SysJobRepositoryImpl } from '../../repository/impl/SysJobRepositoryImpl';
import { ISysJobService } from '../ISysJobService';

/**
 * 定时任务调度信息 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysJobServiceImpl implements ISysJobService {
  @Inject()
  private sysJobRepository: SysJobRepositoryImpl;

  async selectJobPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysJobRepository.selectJobPage(query);
  }
  async selectJobList(sysJob: SysJob): Promise<SysJob[]> {
    return await this.sysJobRepository.selectJobList(sysJob);
  }
  async selectJobById(jobId: string): Promise<SysJob> {
    return await this.sysJobRepository.selectJobById(jobId);
  }
  insertJob(sysJob: SysJob): Promise<string> {
    throw new Error('Method not implemented.');
  }
  updateJob(sysJob: SysJob): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async deleteJobByIds(jobIds: string[]): Promise<number> {
    for (const jobId of jobIds) {
      await this.deleteJob(jobId);
    }
    return await this.sysJobRepository.deleteJobByIds(jobIds);
  }

  checkValidCronExpression(cronExpression: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  changeStatus(sysJob: SysJob): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  runJob(sysJob: SysJob): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  pauseJob(sysJob: SysJob): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  resumeJob(sysJob: SysJob): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  deleteJob(jobId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
