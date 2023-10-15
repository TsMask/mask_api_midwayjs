import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { SysLogOperate } from '../../model/SysLogOperate';
import { SysLogOperateRepositoryImpl } from '../../repository/impl/SysLogOperateRepositoryImpl';
import { ISysLogOperateService } from '../ISysLogOperateService';

/**
 * 操作日志 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysLogOperateServiceImpl implements ISysLogOperateService {
  @Inject()
  private SysLogOperateRepository: SysLogOperateRepositoryImpl;

  async selectSysLogOperatePage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.SysLogOperateRepository.selectSysLogOperatePage(query);
  }

  async selectSysLogOperateById(operId: string): Promise<SysLogOperate> {
    return await this.SysLogOperateRepository.selectSysLogOperateById(operId);
  }

  async selectSysLogOperateList(sysLogOperate: SysLogOperate): Promise<SysLogOperate[]> {
    return await this.SysLogOperateRepository.selectSysLogOperateList(sysLogOperate);
  }

  async insertSysLogOperate(sysLogOperate: SysLogOperate): Promise<string> {
    return await this.SysLogOperateRepository.insertSysLogOperate(sysLogOperate);
  }

  async deleteSysLogOperateByIds(operIds: string[]): Promise<number> {
    return await this.SysLogOperateRepository.deleteSysLogOperateByIds(operIds);
  }

  async cleanSysLogOperate(): Promise<number> {
    return await this.SysLogOperateRepository.cleanSysLogOperate();
  }
}
