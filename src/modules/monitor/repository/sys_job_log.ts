import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { parseNumber } from '../../../framework/utils/parse/parse';
import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysJobLog } from '../model/sys_job_log';

/**调度任务日志表 数据层处理 */
@Provide()
@Singleton()
export class SysJobLogRepository {
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
  ): Promise<[SysJobLog[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysJobLog, 's');
    // 查询条件拼接
    if (query.jobName) {
      tx.andWhere('s.job_name = :jobName', { jobName: query.jobName });
    }
    if (query.jobGroup) {
      tx.andWhere('s.job_group = :jobGroup', { jobGroup: query.jobGroup });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }
    if (query.invokeTarget) {
      tx.andWhere('s.invoke_target like :invokeTarget', {
        invokeTarget: query.invokeTarget + '%',
      });
    }
    if (query.beginTime) {
      if (`${query.beginTime}`.length === 10) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(`${query.beginTime}000`),
        });
      } else if (`${query.beginTime}`.length === 13) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(query.beginTime),
        });
      }
    }
    if (query.endTime) {
      if (`${query.endTime}`.length === 10) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(`${query.endTime}000`),
        });
      } else if (`${query.endTime}`.length === 13) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(query.endTime),
        });
      }
    }

    // 查询结果
    let total = 0;
    let rows: SysJobLog[] = [];

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
   * @param sysJobLog 信息
   * @return 列表
   */
  public async select(sysJobLog: SysJobLog): Promise<SysJobLog[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysJobLog, 's');
    // 构建查询条件
    if (sysJobLog.jobName) {
      tx.andWhere('s.job_name like :jobName', {
        jobName: sysJobLog.jobName + '%',
      });
    }
    if (sysJobLog.jobGroup) {
      tx.andWhere('s.job_group = :jobGroup', { jobGroup: sysJobLog.jobGroup });
    }
    if (sysJobLog.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysJobLog.statusFlag,
      });
    }
    if (sysJobLog.invokeTarget) {
      tx.andWhere('s.invoke_target like :invokeTarget', {
        invokeTarget: sysJobLog.invokeTarget + '%',
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param logId ID
   * @return 信息
   */
  public async selectById(logId: number): Promise<SysJobLog> {
    if (logId <= 0) {
      return new SysJobLog();
    }
    // 查询数据
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysJobLog, 's')
      .andWhere('s.log_id = :logId', { logId })
      .getOne();
    if (!item) {
      return new SysJobLog();
    }
    return item;
  }

  /**
   * 新增
   *
   * @param sysJobLog 信息
   * @return ID
   */
  public async insert(sysJobLog: SysJobLog): Promise<number> {
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysJobLog)
      .values(sysJobLog)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.insertId > 0) {
      return raw.insertId;
    }
    return 0;
  }

  /**
   * 批量删除
   *
   * @param logIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(logIds: number[]): Promise<number> {
    if (logIds.length === 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysJobLog)
      .andWhere('log_id in (:logIds)', { logIds: logIds })
      .execute();
    return tx.affected;
  }

  /**
   * 清空集合数据
   *
   * @return 影响记录数
   */
  public async clean(): Promise<number> {
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysJobLog)
      .execute();
    return tx.affected;
  }
}
