import { SysLogininfor } from '../model/SysLogininfor';

/**
 * 系统访问日志情况信息 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysLogininforService {
  /**
   * 新增系统登录日志
   *
   * @param sysLogininfor 访问日志对象
   */
  insertLogininfor(sysLogininfor: SysLogininfor): Promise<number>;

  /**
   * 查询系统登录日志集合
   *
   * @param sysLogininfor 访问日志对象
   * @return 登录记录集合
   */
  selectLogininforList(sysLogininfor: SysLogininfor): Promise<SysLogininfor[]>;

  /**
   * 批量删除系统登录日志
   *
   * @param infoIds 需要删除的登录日志ID
   * @return 结果
   */
  deleteLogininforByIds(infoIds: string[]): Promise<number>;

  /**
   * 清空系统登录日志
   */
  cleanLogininfor(): Promise<number>;
}
