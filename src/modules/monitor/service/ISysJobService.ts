import { SysJob } from '../model/SysJob';

/**
 * 定时任务调度信息信息 服务层接口
 *
 * @author TsMask
 */
export interface ISysJobService {
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
  selectJobById(jobId: string): Promise<SysJob>;

  /**
   * 校验调度任务名称和组是否唯一
   *
   * @param jobName 调度任务名称
   * @param jobGroup 调度任务组
   * @return 调度任务ID
   */
  checkUniqueJobName(
    jobName: string,
    jobGroup: string,
    jobId: string
  ): Promise<boolean>;

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

  /**
   * 任务调度状态修改
   *
   * @param sysJob 调度任务信息
   * @return 结果
   */
  changeStatus(sysJob: SysJob): Promise<boolean>;

  /**
   * 立即运行一次调度任务
   *
   * @param sysJob 调度任务信息
   * @return 结果
   */
  runQueueJob(sysJob: SysJob): Promise<boolean>;

  /**
   * 重置初始调度任务
   *
   * @return 结果
   */
  resetQueueJob(): Promise<void>;
}
