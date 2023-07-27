import { SysJob } from '../model/SysJob';

/**
 * 调度任务信息 数据层接口
 *
 * @author TsMask
 */
export interface ISysJobRepository {
  /**
   * 分页查询调度任务集合
   *
   * @param query 查询信息
   * @return 操作日志集合
   */
  selectJobPage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 查询调度任务集合
   *
   * @param sysJob 调度任务信息
   * @return 调度任务列表
   */
  selectJobList(sysJob: SysJob): Promise<SysJob[]>;

  /**
   * 通过调度ID查询调度任务信息
   *
   * @param jobId 调度ID
   * @return 调度任务信息
   */
  selectJobByIds(jobIds: string[]): Promise<SysJob[]>;

  /**
   * 校验调度任务是否唯一
   *
   * @param sysJob 调度任务信息
   * @return 调度任务id
   */
  checkUniqueJob(sysJob: SysJob): Promise<string>;

  /**
   * 通过调用目标字符串查询调度任务信息
   *
   * @param invokeTarget 调用目标字符串
   * @return 调度任务信息
   */
  selectJobByInvokeTarget(invokeTarget: string): Promise<SysJob>;

  /**
   * 新增调度任务信息
   *
   * @param sysJob 调度任务信息
   * @return 调度任务ID
   */
  insertJob(sysJob: SysJob): Promise<string>;

  /**
   * 修改调度任务信息
   *
   * @param sysJob 调度任务信息
   * @return 修改记录数
   */
  updateJob(sysJob: SysJob): Promise<number>;

  /**
   * 批量删除调度任务信息
   *
   * @param jobIds 需要删除的调度任务ID
   * @return 结果
   */
  deleteJobByIds(jobIds: string[]): Promise<number>;
}
