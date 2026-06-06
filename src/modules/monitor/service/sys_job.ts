import { Framework } from '@midwayjs/bullmq';
import { Job } from 'bullmq';
import { Provide, Inject, Singleton, Init } from '@midwayjs/core';

import { SysJob } from '../model/sys_job';
import { SysJobLog } from '../model/sys_job_log';
import { SysJobRepository } from '../repository/sys_job';
import { SysJobLogRepository } from '../repository/sys_job_log';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { FileUtil } from '../../../framework/utils/file/file';
import { SysDictDataService } from '../../system/service/sys_dict_data';
import { ProcessorData, ProcessorOptions } from '../../../typings/processor';

/**调度任务 服务层处理 */
@Provide()
@Singleton()
export class SysJobService {
  /**调度任务数据信息 */
  @Inject()
  private sysJobRepository!: SysJobRepository;

  /**调度任务日志数据信息 */
  @Inject()
  private sysJobLogRepository!: SysJobLogRepository;

  /**字典类型服务 */
  @Inject()
  private sysDictTypeService!: SysDictDataService;

  /**任务队列 */
  @Inject()
  private bullFramework!: Framework;

  /**文件服务 */
  @Inject()
  private fileUtil!: FileUtil;

  /**初始化 */
  @Init()
  public async init() {
    // 启动时，初始化调度任务
    await this.reset();
  }

  /**
   * 分页查询
   * @param query 分页查询
   * @returns 结果
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysJob[], number]> {
    return await this.sysJobRepository.selectByPage(query);
  }

  /**
   * 查询
   * @param query 分页查询
   * @returns 结果
   */
  public async find(sysJob: SysJob): Promise<SysJob[]> {
    return await this.sysJobRepository.select(sysJob);
  }

  /**
   * 通过ID查询
   * @param jobId
   * @returns
   */
  public async findById(jobId: number): Promise<SysJob> {
    if (jobId <= 0) {
      return new SysJob();
    }
    const jobs = await this.sysJobRepository.selectByIds([jobId]);
    if (jobs.length > 0) {
      return jobs[0];
    }
    return new SysJob();
  }

  /**
   * 新增
   * @param sysJob 信息
   * @returns ID
   */
  public async insert(sysJob: SysJob): Promise<number> {
    const insertId = await this.sysJobRepository.insert(sysJob);
    if (insertId && sysJob.statusFlag === STATUS_YES) {
      sysJob.jobId = insertId;
      await this.insertQueueJob(sysJob, true);
    }
    return insertId;
  }

  /**
   * 修改
   * @param sysJob 信息
   * @returns 影响记录数
   */
  public async update(sysJob: SysJob): Promise<number> {
    const rows = await this.sysJobRepository.update(sysJob);
    if (rows > 0) {
      // 更新时始终先移除旧的队列任务
      await this.deleteQueueJob(sysJob);
      // 状态正常时重新添加队列任务
      if (sysJob.statusFlag === STATUS_YES) {
        await this.insertQueueJob(sysJob, true);
      }
    }
    return rows;
  }

  /**
   * 批量删除
   * @param jobIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(jobIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const jobs = await this.sysJobRepository.selectByIds(jobIds);
    if (jobs.length <= 0) {
      return [0, '没有权限访问调度任务数据！'];
    }
    if (jobs.length === jobIds.length) {
      // 清除任务
      for (const job of jobs) {
        await this.deleteQueueJob(job);
      }
      const rows = await this.sysJobRepository.deleteByIds(jobIds);
      return [rows, ''];
    }
    return [0, '删除调度任务信息失败！'];
  }

  /**
   * 校验调度任务名称和组是否唯一
   * @param jobName 调度任务名称
   * @param jobGroup 调度任务组
   * @param jobId 调度任务ID
   * @returns true 唯一，false 不唯一
   */
  public async checkUniqueJobName(
    jobName: string,
    jobGroup: string,
    jobId: number
  ): Promise<boolean> {
    const sysJob = new SysJob();
    sysJob.jobName = jobName;
    sysJob.jobGroup = jobGroup;
    const uniqueId = await this.sysJobRepository.checkUnique(sysJob);
    if (uniqueId === jobId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 添加调度任务
   *
   * @param sysJob 调度任务信息
   * @param repeat 触发执行cron重复多次
   * @return 结果
   */
  private async insertQueueJob(
    sysJob: SysJob,
    repeat: boolean
  ): Promise<boolean> {
    // 获取队列 Processor
    const queue = this.bullFramework.getQueue(sysJob.invokeTarget);
    if (!queue) return false;

    // BullMQ v5 拒绝纯数字字符串和非三段式冒号格式作为自定义 jobId
    const jobId = `job_${sysJob.jobId}`;

    // BullMQ 的 completed/failed 事件由 Worker 发出，Queue 不会发出这些事件
    const worker = this.bullFramework.getWorker(sysJob.invokeTarget);
    if (worker) {
      const completedOnCount = worker.listenerCount('completed');
      if (completedOnCount === 0) {
        worker.addListener(
          'completed',
          async (job: Job, Result: ProcessorData) => {
            const jobLog = {
              timestamp: job.timestamp,
              data: job.data,
              Result: Result,
            };
            await this.saveJobLog(jobLog, STATUS_YES);
            await job.remove();
          }
        );
        worker.addListener('failed', async (job: Job, error: Error) => {
          const jobLog = {
            timestamp: job.timestamp,
            data: job.data,
            Result: error,
          };
          await this.saveJobLog(jobLog, STATUS_NO);
          await job.remove();
        });
      }
    }

    // 给执行任务数据参数
    const options = {
      repeat: repeat,
      sysJob: sysJob,
    };

    // 不是重复任务的情况，立即执行一次
    if (!repeat) {
      // 判断是否已经有单次执行任务
      let job = await queue.getJob(jobId);
      if (job) {
        // 拒绝执行已经进行中的，其他状态的移除
        const isActive = await job.isActive();
        if (isActive) {
          return false;
        }
        await job.remove();
      }
      // 执行单次任务
      job = await queue.addJobToQueue(options, { jobId: jobId });
      // 执行中或等待中的都返回正常
      const isActive = await job.isActive();
      const isWaiting = await job.isWaiting();
      return isActive || isWaiting;
    }

    // 移除旧的调度器
    const repeatableJobs = await queue.getJobSchedulers();
    for (const repeatable of repeatableJobs) {
      if (repeatable.key === jobId) {
        await queue.removeJobScheduler(repeatable.key);
      }
    }

    // 清除旧的单次执行任务（repeat 任务由 removeJobScheduler 自动清理）
    const oldJobs = await queue.getJobs([
      'active',
      'wait',
      'delayed',
      'waiting-children',
      'prioritized',
    ]);
    for (const oldJob of oldJobs) {
      if (!oldJob.id) continue;
      if (oldJob.id === jobId) {
        await oldJob.remove();
      }
    }

    // 添加重复任务
    // 直接调用 upsertJobScheduler，用 jobId 作为调度器 ID
    // 不能用 addJobToQueue，因为它会用队列名作为调度器 ID，导致 deleteQueueJob 无法匹配移除
    await queue.upsertJobScheduler(
      jobId,
      {
        pattern: sysJob.cronExpression,
      },
      {
        name: sysJob.jobName,
        data: options,
      }
    );
    return true;
  }

  /**
   * 删除调度任务
   * @param sysJob 信息
   * @returns 结果
   */
  private async deleteQueueJob(sysJob: SysJob): Promise<void> {
    // 获取队列 Processor
    const queue = this.bullFramework.getQueue(sysJob.invokeTarget);
    if (!queue) return;

    const jobId = `job_${sysJob.jobId}`;

    // 移除调度器，停止未来的定时调度
    // BullMQ v5 中 upsertJobScheduler 创建的调度器，key 字段才是调度器 ID
    const repeatableJobs = await queue.getJobSchedulers();
    for (const repeatable of repeatableJobs) {
      if (repeatable.key === jobId) {
        await queue.removeJobScheduler(repeatable.key);
      }
    }

    // 获取所有未完成的任务并逐个移除
    // 注意：repeat: 前缀的调度器任务不能直接 remove，由 removeJobScheduler 自动清理
    // 这里只处理单次执行产生的任务
    const jobs = await queue.getJobs([
      'active',
      'wait',
      'delayed',
      'waiting-children',
      'prioritized',
    ]);
    for (const job of jobs) {
      if (!job.id) continue;
      if (job.id === jobId) {
        await job.remove();
      }
    }
  }

  /**
   * 日志记录保存
   * @param jld 日志记录数据
   * @param status 日志状态
   * @returns
   */
  private async saveJobLog(
    jld: {
      timestamp: number;
      data: ProcessorOptions;
      Result: any;
    },
    status: string
  ) {
    // 读取任务信息
    const sysJob = jld.data.sysJob;

    // 任务日志不需要记录
    if (sysJob.saveLog === '' || sysJob.saveLog === STATUS_NO) {
      return;
    }

    // 结果信息key的Name
    let ResultNmae = 'failed';
    if (status === STATUS_YES) {
      ResultNmae = 'completed';
    }

    // 结果信息序列化字符串
    let jobMsg = JSON.stringify({
      cron: jld.data.repeat,
      name: ResultNmae,
      message: jld.Result,
    });
    if (jobMsg.length >= 500) {
      jobMsg = jobMsg.substring(0, 500);
    }

    // 创建日志对象
    const now = Date.now().valueOf();
    const sysJobLog = new SysJobLog();
    sysJobLog.jobName = sysJob.jobName;
    sysJobLog.jobGroup = sysJob.jobGroup;
    sysJobLog.invokeTarget = sysJob.invokeTarget;
    sysJobLog.targetParams = sysJob.targetParams;
    sysJobLog.statusFlag = status;
    sysJobLog.jobMsg = jobMsg;
    sysJobLog.costTime = now - jld.timestamp;
    sysJobLog.createTime = now;
    // 插入数据
    await this.sysJobLogRepository.insert(sysJobLog);
  }

  /**
   * 重置初始调度任务
   */
  public async reset(): Promise<void> {
    // 获取bull上注册的队列列表
    const queueList = this.bullFramework.getQueueList();
    if (queueList && queueList.length === 0) {
      return;
    }
    // 查询系统中定义状态为正常启用的任务
    const sysJob = new SysJob();
    sysJob.statusFlag = STATUS_YES;
    const sysJobs = await this.sysJobRepository.select(sysJob);
    for (const sysJob of sysJobs) {
      for (const queue of queueList) {
        if (queue.getQueueName() === sysJob.invokeTarget) {
          await this.insertQueueJob(sysJob, true);
        }
      }
    }
  }

  /**
   * 立即运行一次调度任务
   * @param sysJob 信息
   * @returns 结果
   */
  public async run(sysJob: SysJob): Promise<boolean> {
    return await this.insertQueueJob(sysJob, false);
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysJob[], fileName: string) {
    // 读取任务组名字典数据
    const dictSysJobGroup =
      await this.sysDictTypeService.findByType('sys_job_group');
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const item of rows) {
      // 任务组名
      let sysJobGroup = '';
      for (const v of dictSysJobGroup) {
        if (item.jobGroup === v.dataValue) {
          sysJobGroup = v.dataLabel;
          break;
        }
      }
      let misfirePolicy = '放弃执行';
      if (item.misfirePolicy === '1') {
        misfirePolicy = '立即执行';
      } else if (item.misfirePolicy === '2') {
        misfirePolicy = '执行一次';
      }
      let concurrent = '禁止';
      if (item.concurrent === '1') {
        concurrent = '允许';
      }
      // 状态
      let statusValue = '失败';
      if (item.statusFlag === '1') {
        statusValue = '成功';
      }
      const data = {
        任务编号: item.jobId,
        任务名称: item.jobName,
        任务组名: sysJobGroup,
        调用目标: item.invokeTarget,
        传入参数: item.targetParams,
        执行表达式: item.cronExpression,
        出错策略: misfirePolicy,
        并发执行: concurrent,
        任务状态: statusValue,
        备注说明: item.remark,
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }
}
