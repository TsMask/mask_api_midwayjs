import { SysLogininfor } from '../../model/sys_logininfor';

/**
 * 系统访问日志情况信息 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysLogininforRepoInterface {
  /**
   * 新增系统登录日志
   *
   * @param sys_logininfor 访问日志对象
   */
  insert_logininfor(sys_logininfor: SysLogininfor): Promise<SysLogininfor>;

  /**
   * 查询系统登录日志集合
   *
   * @param sys_logininfor 访问日志对象
   * @return 登录记录集合
   */
  select_logininfor_list(sys_logininfor: SysLogininfor): Promise<SysLogininfor[]>;

  /**
   * 批量删除系统登录日志
   *
   * @param info_ids 需要删除的登录日志ID
   * @return 结果
   */
  delete_logininfor_by_ids(info_ids: string[]): Promise<number>;

  /**
   * 清空系统登录日志
   *
   * @return 结果
   */
  clean_logininfor(): Promise<number>;
}
