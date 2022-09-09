import { SysOperLog } from '../../model/sys_oper_log';

/**
 * 操作日志 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysOperLogRepoInterface {
  /**
   * 新增操作日志
   *
   * @param sys_oper_log 操作日志对象
   */
  insert_oper_log(sys_oper_log: SysOperLog): Promise<number>;

  /**
   * 查询系统操作日志集合
   *
   * @param sys_oper_log 操作日志对象
   * @return 操作日志集合
   */
  select_oper_log_list(sys_oper_log: SysOperLog): Promise<SysOperLog[]>;

  /**
   * 批量删除系统操作日志
   *
   * @param oper_ids 需要删除的操作日志ID
   * @return 结果
   */
  delete_oper_log_by_ids(oper_ids: string[]): Promise<number>;

  /**
   * 查询操作日志详细
   *
   * @param oper_id 操作ID
   * @return 操作日志对象
   */
  select_oper_log_by_id(oper_id: string): Promise<SysOperLog>;

  /**
   * 清空操作日志
   */
  clean_oper_log(): Promise<number>;
}
