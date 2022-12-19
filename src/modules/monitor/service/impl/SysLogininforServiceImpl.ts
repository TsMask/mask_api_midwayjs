import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysLogininfor } from '../../model/SysLogininfor';
import { SysLogininforRepositoryImpl } from '../../repository/impl/SysLogininforRepositoryImpl';
import { ISysLogininforService } from '../ISysLogininforService';

/**
 * 系统访问日志情况信息 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysLogininforServiceImpl implements ISysLogininforService {
  @Inject()
  private sysLogininforRepository: SysLogininforRepositoryImpl;

  async selectLogininforPage(query: any): Promise<rowPages> {
    return await this.sysLogininforRepository.selectLogininforPage(query);
  }

  async selectLogininforList(
    sysLogininfor: SysLogininfor
  ): Promise<SysLogininfor[]> {
    return await this.sysLogininforRepository.selectLogininforList(
      sysLogininfor
    );
  }

  async insertLogininfor(sysLogininfor: SysLogininfor): Promise<string> {
    return await this.sysLogininforRepository.insertLogininfor(sysLogininfor);
  }

  async deleteLogininforByIds(infoIds: string[]): Promise<number> {
    return await this.sysLogininforRepository.deleteLogininforByIds(infoIds);
  }

  async cleanLogininfor(): Promise<number> {
    return await this.sysLogininforRepository.cleanLogininfor();
  }
}
