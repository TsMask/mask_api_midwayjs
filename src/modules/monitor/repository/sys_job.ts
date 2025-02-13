import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysJob } from '../model/sys_job';

/**调度任务表 数据层处理 */
@Provide()
@Singleton()
export class SysJobRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 分页查询集合
   *
   * @param query 参数
   * @returns 集合
   */
  public async selectByPage(
    query: Record<string, string>
  ): Promise<[SysJob[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysJob, 's');
    // 查询条件拼接
    if (query.jobName) {
      tx.where("s.job_name like concat(:jobName, '%')", {
        jobName: query.jobName,
      });
    }
    if (query.jobGroup) {
      tx.where('s.job_group = :jobGroup', { jobGroup: query.jobGroup });
    }
    if (query.invokeTarget) {
      tx.where("s.invoke_target like concat(:invokeTarget, '%')", {
        invokeTarget: query.invokeTarget,
      });
    }
    if (query.statusFlag) {
      tx.where('s.status_flag = :statusFlag', { statusFlag: query.statusFlag });
    }

    // 查询结果
    let total: number = 0;
    let rows: SysJob[] = [];

    // 查询数量为0直接返回
    total = await tx.getCount();
    if (total <= 0) {
      return [rows, total];
    }

    // 查询数据分页
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    rows = await tx.getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysJob 信息
   * @return 列表
   */
  public async select(sysJob: SysJob): Promise<SysJob[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysJob, 's');
    // 构建查询条件
    if (sysJob.jobName) {
      tx.where("s.job_name like concat(:jobName, '%')", {
        jobName: sysJob.jobName,
      });
    }
    if (sysJob.jobGroup) {
      tx.where('s.job_group = :jobGroup', { jobGroup: sysJob.jobGroup });
    }
    if (sysJob.invokeTarget) {
      tx.where("s.invoke_target like concat(:invokeTarget, '%')", {
        invokeTarget: sysJob.invokeTarget,
      });
    }
    if (sysJob.statusFlag) {
      tx.where('s.status_flag = :statusFlag', {
        statusFlag: sysJob.statusFlag,
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param id ID
   * @return 信息
   */
  public async selectByIds(jobIds: number[]): Promise<SysJob[]> {
    if (jobIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysJob, 's')
      .where('s.job_id in (:jobIds)', { jobIds })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysJob 信息
   * @return ID
   */
  public async insert(sysJob: SysJob): Promise<number> {
    if (sysJob.createBy) {
      const ms = Date.now().valueOf();
      sysJob.updateBy = sysJob.createBy;
      sysJob.createTime = ms;
      sysJob.updateTime = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysJob)
      .values(sysJob)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.insertId > 0) {
      return raw.insertId;
    }
    return 0;
  }

  /**
   * 更新
   *
   * @param sysJob 信息
   * @return 影响记录数
   */
  public async update(sysJob: SysJob): Promise<number> {
    if (sysJob.jobId <= 0) {
      return 0;
    }
    if (sysJob.updateBy) {
      sysJob.updateTime = Date.now().valueOf();
    }
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysJob)
      .set(sysJob)
      .where('jobId = :jobId', { jobId: sysJob.jobId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param ids ID数组
   * @return 影响记录数
   */
  public async deleteByIds(jobIds: number[]): Promise<number> {
    if (jobIds.length <= 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysJob)
      .where('jobId in (:jobIds)', { jobIds })
      .execute();
    return tx.affected;
  }

  /**
   * 校验调度任务是否唯一
   *
   * @param sysJob 调度任务信息
   * @return 调度任务id
   */
  public async checkUniqueJob(sysJob: SysJob): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.job_id')
      .from(SysJob, 's');
    // 查询条件拼接
    if (sysJob.jobName) {
      tx.where('s.job_name = :jobName', { jobName: sysJob.jobName });
    }
    if (sysJob.jobGroup) {
      tx.where('s.job_group = :jobGroup', { jobGroup: sysJob.jobGroup });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.jobId;
  }
}
