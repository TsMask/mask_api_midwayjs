import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { SysLogininfor } from '../../model/SysLogininfor';
import { SysLogininforRepositoryImpl } from '../../repository/impl/SysLogininforRepositoryImpl';
import { ISysLogininforService } from '../ISysLogininforService';

/**
 * 系统访问日志情况信息 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysLogininforServiceImpl implements ISysLogininforService {
  @Inject()
  private sysLogininforRepository: SysLogininforRepositoryImpl;

  async selectLogininforPage(
    query: ListQueryPageOptions
  ): Promise<RowPagesType> {
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

  async newLogininfor(
    userName: string,
    status: string,
    msg: string,
    ...ilobArgs: string[]
  ): Promise<string> {
    const sysLogininfor = new SysLogininfor();
    sysLogininfor.ipaddr = ilobArgs[0];
    sysLogininfor.loginLocation = ilobArgs[1];
    sysLogininfor.os = ilobArgs[2];
    sysLogininfor.browser = ilobArgs[3];
    sysLogininfor.userName = userName;
    sysLogininfor.status = status;
    sysLogininfor.msg = msg;
    return await this.sysLogininforRepository.insertLogininfor(sysLogininfor);
  }
}
