import { SysOperLog } from '../model/SysOperLog';

/**
 * 操作日志 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysOperLogRepository {
  /**
   * 分页查询系统操作日志集合
   *
   * @param query 查询信息
   * @return 操作日志集合
   */
  selectOperLogPage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 查询系统操作日志集合
   *
   * @param sysOperLog 操作日志对象
   * @return 操作日志集合
   */
  selectOperLogList(sysOperLog: SysOperLog): Promise<SysOperLog[]>;

  /**
   * 新增操作日志
   *
   * @param sysOperLog 操作日志对象
   */
  insertOperLog(sysOperLog: SysOperLog): Promise<string>;

  /**
   * 批量删除系统操作日志
   *
   * @param operIds 需要删除的操作日志ID
   * @return 结果
   */
  deleteOperLogByIds(operIds: string[]): Promise<number>;

  /**
   * 查询操作日志详细
   *
   * @param operId 操作ID
   * @return 操作日志对象
   */
  selectOperLogById(operId: string): Promise<SysOperLog>;

  /**
   * 清空操作日志
   */
  cleanOperLog(): Promise<number>;
}
