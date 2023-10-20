import { SysLogLogin } from '../model/SysLogLogin';

/**
 * 系统登录日志信息 服务层接口
 *
 * @author TsMask
 */
export interface ISysLogLoginService {
  /**
   * 分页查询系统登录日志集合
   *
   * @param query 查询信息
   * @return 操作日志集合
   */
  selectSysLogLoginPage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 查询系统登录日志集合
   *
   * @param sysLogLogin 登录日志对象
   * @return 登录记录集合
   */
  selectSysLogLoginList(sysLogLogin: SysLogLogin): Promise<SysLogLogin[]>;

  /**
   * 新增系统登录日志
   *
   * @param sysLogLogin 登录日志对象
   */
  insertSysLogLogin(sysLogLogin: SysLogLogin): Promise<string>;

  /**
   * 批量删除系统登录日志
   *
   * @param loginIds 需要删除的登录日志ID
   * @return 结果
   */
  deleteSysLogLoginByIds(loginIds: string[]): Promise<number>;

  /**
   * 清空系统登录日志
   *
   * @return 结果
   */
  cleanSysLogLogin(): Promise<number>;

  /**
   * 创建系统登录日志
   *
   * @return 结果
   */
  createSysLogLogin(
    userName: string,
    status: string,
    msg: string,
    ...ilobArgs: string[]
  ): Promise<string>;
}
