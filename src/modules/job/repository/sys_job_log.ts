import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { parseNumber } from '../../../internal/shared/parse/parse';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysJobLog } from '../model/sys_job_log';
import { ResultSetHeader } from '../../../typings/commont';

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
    if (query.job_name) {
      tx.andWhere('s.job_name = :jobName', { jobName: query.job_name });
    }
    if (query.job_group) {
      tx.andWhere('s.job_group = :jobGroup', { jobGroup: query.job_group });
    }
    if (query.log_status) {
      tx.andWhere('s.log_status = :logStatus', {
        logStatus: query.log_status,
      });
    }
    if (query.job_invoke_target) {
      tx.andWhere('s.job_invoke_target like :jobInvokeTarget', {
        jobInvokeTarget: query.job_invoke_target + '%',
      });
    }
    if (query.create_time_begin) {
      if (`${query.create_time_begin}`.length === 10) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(`${query.create_time_begin}000`),
        });
      } else if (`${query.create_time_begin}`.length === 13) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(query.create_time_begin),
        });
      }
    }
    if (query.create_time_end) {
      if (`${query.create_time_end}`.length === 10) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(`${query.create_time_end}000`),
        });
      } else if (`${query.create_time_end}`.length === 13) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(query.create_time_end),
        });
      }
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

    // 排序，格式: sort=createTime,id:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      job_name: 's.job_name',
      job_group: 's.job_group',
      job_invoke_target: 's.job_invoke_target',
      log_status: 's.log_status',
      create_time: 's.create_time',
    };
    const orders = this.db.sortParse(query.sort, columnMap);
    this.db.sortOrDefault(tx, orders, 's.id DESC');

    const rows = await tx.getMany();
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
    if (sysJobLog.logStatus) {
      tx.andWhere('s.log_status = :logStatus', {
        logStatus: sysJobLog.logStatus,
      });
    }
    if (sysJobLog.jobInvokeTarget) {
      tx.andWhere('s.job_invoke_target like :jobInvokeTarget', {
        jobInvokeTarget: sysJobLog.jobInvokeTarget + '%',
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
      .andWhere('s.id = :id', { id: logId })
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
      .andWhere('id in (:logIds)', { logIds: logIds })
      .execute();
    return tx.affected ?? 0;
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
    return tx.affected ?? 0;
  }
}
