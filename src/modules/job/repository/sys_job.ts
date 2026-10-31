import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysJob } from '../model/sys_job';
import { ResultSetHeader } from '../../../typings/commont';

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
    if (query.job_name) {
      tx.andWhere('s.job_name like :jobName', {
        jobName: query.job_name + '%',
      });
    }
    if (query.job_group) {
      tx.andWhere('s.job_group = :jobGroup', { jobGroup: query.job_group });
    }
    if (query.job_invoke_target) {
      tx.andWhere('s.job_invoke_target like :jobInvokeTarget', {
        jobInvokeTarget: query.job_invoke_target + '%',
      });
    }
    if (query.job_status) {
      tx.andWhere('s.job_status = :jobStatus', {
        jobStatus: query.job_status,
      });
    }

    // 查询数量为0直接返回
    const total = await tx.getCount();
    if (total <= 0) {
      return [[], total];
    }

    // 查询数据分页
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    // 排序，格式: sort=createTime,jobName:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      job_name: 's.job_name',
      job_group: 's.job_group',
      job_invoke_target: 's.job_invoke_target',
      job_cron: 's.job_cron',
      job_misfire_policy: 's.job_misfire_policy',
      job_concurrent: 's.job_concurrent',
      job_status: 's.job_status',
      create_by: 's.create_by',
      create_time: 's.create_time',
      update_time: 's.update_time',
    };
    if (query.sort) {
      const items = query.sort.split(',');
      for (const item of items) {
        const [field, dir] = item.split(':');
        const column = columnMap[field];
        if (!column) continue;
        const order: 'ASC' | 'DESC' = dir === 'asc' ? 'ASC' : 'DESC';
        tx.addOrderBy(column, order);
      }
    } else {
      tx.addOrderBy('s.id', 'DESC');
    }

    const rows = await tx.getMany();
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
      tx.andWhere('s.job_name like :jobName', {
        v: sysJob.jobName + '%',
      });
    }
    if (sysJob.jobGroup) {
      tx.andWhere('s.job_group = :jobGroup', { jobGroup: sysJob.jobGroup });
    }
    if (sysJob.jobInvokeTarget) {
      tx.andWhere('s.job_invoke_target like :jobInvokeTarget', {
        jobInvokeTarget: sysJob.jobInvokeTarget + '%',
      });
    }
    if (sysJob.jobStatus) {
      tx.andWhere('s.job_status = :jobStatus', {
        jobStatus: sysJob.jobStatus,
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
      .andWhere('s.id in (:jobIds)', { jobIds })
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
    if (sysJob.id <= 0) {
      return 0;
    }
    if (sysJob.updateBy) {
      sysJob.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysJob);
    delete (data as Partial<SysJob>).id;
    delete (data as Partial<SysJob>).createBy;
    delete (data as Partial<SysJob>).createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysJob)
      .set(data)
      .andWhere('id = :id', { id: sysJob.id })
      .execute();
    return tx.affected || 0;
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
      .andWhere('id in (:jobIds)', { jobIds })
      .execute();
    return tx.affected || 0;
  }

  /**
   * 校验信息是否唯一
   *
   * @param sysJob 调度任务信息
   * @return 调度任务id
   */
  public async checkUnique(sysJob: SysJob): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysJob, 's');
    // 查询条件拼接
    if (sysJob.jobName) {
      tx.andWhere('s.job_name = :jobName', { jobName: sysJob.jobName });
    }
    if (sysJob.jobGroup) {
      tx.andWhere('s.job_group = :jobGroup', { jobGroup: sysJob.jobGroup });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.id;
  }
}
