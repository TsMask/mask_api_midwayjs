import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { SysLogLogin } from '../../model/SysLogLogin';
import { SysLogLoginRepositoryImpl } from '../../repository/impl/SysLogLoginRepositoryImpl';
import { ISysLogLoginService } from '../ISysLogLoginService';

/**
 * 系统登录日志信息 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysLogLoginServiceImpl implements ISysLogLoginService {
  @Inject()
  private sysLogLoginRepository: SysLogLoginRepositoryImpl;

  async selectSysLogLoginPage(
    query: ListQueryPageOptions
  ): Promise<RowPagesType> {
    return await this.sysLogLoginRepository.selectSysLogLoginPage(query);
  }

  async selectSysLogLoginList(
    SysLogLogin: SysLogLogin
  ): Promise<SysLogLogin[]> {
    return await this.sysLogLoginRepository.selectSysLogLoginList(SysLogLogin);
  }

  async insertSysLogLogin(SysLogLogin: SysLogLogin): Promise<string> {
    return await this.sysLogLoginRepository.insertSysLogLogin(SysLogLogin);
  }

  async deleteSysLogLoginByIds(loginIds: string[]): Promise<number> {
    return await this.sysLogLoginRepository.deleteSysLogLoginByIds(loginIds);
  }

  async cleanSysLogLogin(): Promise<number> {
    return await this.sysLogLoginRepository.cleanSysLogLogin();
  }

  async createSysLogLogin(
    userName: string,
    status: string,
    msg: string,
    ...ilobArgs: string[]
  ): Promise<string> {
    const sysLogLogin = new SysLogLogin();
    sysLogLogin.ipaddr = ilobArgs[0];
    sysLogLogin.loginLocation = ilobArgs[1];
    sysLogLogin.os = ilobArgs[2];
    sysLogLogin.browser = ilobArgs[3];
    sysLogLogin.userName = userName;
    sysLogLogin.status = status;
    sysLogLogin.msg = msg;
    return await this.sysLogLoginRepository.insertSysLogLogin(sysLogLogin);
  }
}
