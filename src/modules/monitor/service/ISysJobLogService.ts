import { SysJobLog } from '../model/SysJobLog';

/**
 * 定时任务调度日志信息信息 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysJobLogService {
  /**
   * 分页查询调度任务日志集合
   *
   * @param query 查询信息
   * @return 操作日志集合
   */
  selectJobLogPage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 查询调度任务日志集合
   *
   * @param sysJobLog 调度任务日志信息
   * @return 调度任务列表
   */
  selectJobLogList(sysJobLog: SysJobLog): Promise<SysJobLog[]>;

  /**
   * 通过调度ID查询调度任务日志信息
   *
   * @param jobLogId 调度任务日志ID
   * @return 调度任务日志信息
   */
  selectJobLogById(jobLogId: string): Promise<SysJobLog>;

  /**
   * 新增调度任务日志信息
   *
   * @param sysJobLog 调度任务日志信息
   * @return 调度任务日志ID
   */
  insertJobLog(sysJobLog: SysJobLog): Promise<string>;

  /**
   * 批量删除调度任务日志信息
   *
   * @param jobLogId 需要删除的调度任务日志ID
   * @return 删除记录数
   */
  deleteJobLogByIds(jobLogId: string[]): Promise<number>;

  /**
   * 清空调度任务日志
   * @return 删除记录数
   */
  cleanJobLog(): Promise<number>;
}
