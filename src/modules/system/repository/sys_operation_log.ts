import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { ResultSetHeader } from '../../../typings/commont';
import { SysOperationLog } from '../model/sys_operation_log';

/**系统操作日志表 数据层处理 */
@Provide()
@Singleton()
export class SysOperationLogRepository {
  @Inject()
  private db: DynamicDataSource;

  public async selectByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysOperationLog[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysOperationLog, 's');
    if (query.title) {
      tx.andWhere('s.title like :title', { title: query.title + '%' });
    }
    if (query.operation_type) {
      const operationTypes = query.operation_type.split(',');
      tx.andWhere('s.operation_type in (:operationTypes)', {
        operationTypes,
      });
    }
    if (query.create_by) {
      tx.andWhere('s.create_by like :createBy', {
        createBy: query.create_by + '%',
      });
    }
    if (query.operation_ip) {
      tx.andWhere('s.operation_ip like :operationIp', {
        operationIp: query.operation_ip + '%',
      });
    }
    if (query.operation_status) {
      tx.andWhere('s.operation_status = :operationStatus', {
        operationStatus: query.operation_status,
      });
    }
    const beginTime = normalizeTimeRange(query.create_time_begin, '000');
    if (beginTime > 0) {
      tx.andWhere('s.create_time >= :beginTime', { beginTime });
    }
    const endTime = normalizeTimeRange(query.create_time_end, '999');
    if (endTime > 0) {
      tx.andWhere('s.create_time <= :endTime', { endTime });
    }
    if (filter?.sql) {
      tx.andWhere(
        `s.create_by in (select distinct user_name from sys_user where ${filter.sql})`,
        filter.params
      );
    }

    const total = await tx.getCount();
    if (total <= 0) {
      return [[], total];
    }

    const [pageNum, pageSize] = this.db.pageNumSize(
      query.page_num,
      query.page_size
    );
    tx.skip(pageSize * pageNum).take(pageSize);

    const columnMap: Record<string, string> = {
      id: 's.id',
      create_by: 's.create_by',
      create_time: 's.create_time',
      title: 's.title',
      operation_type: 's.operation_type',
      operation_cost_time: 's.operation_cost_time',
      operation_status: 's.operation_status',
    };
    let sorted = false;
    if (query.sort) {
      for (const item of query.sort.split(',')) {
        const [field, dir] = item.split(':');
        const column = columnMap[field];
        if (!column) continue;
        const order: 'ASC' | 'DESC' = dir === 'asc' ? 'ASC' : 'DESC';
        tx.addOrderBy(column, order);
        sorted = true;
      }
    }
    if (!sorted) {
      tx.addOrderBy('s.id', 'DESC');
    }

    const rows = await tx.getMany();
    return [rows, total];
  }

  public async insert(operationLog: SysOperationLog): Promise<number> {
    if (operationLog.createBy) {
      operationLog.createTime = Date.now();
    }
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysOperationLog)
      .values(operationLog)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    return raw.insertId > 0 ? raw.insertId : 0;
  }

  public async clean(): Promise<number> {
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysOperationLog)
      .where('1 = 1')
      .execute();
    return tx.affected ?? 0;
  }
}

function normalizeTimeRange(value: string, suffix: string): number {
  if (!value) return 0;
  if (value.length === 10) {
    return parseNumber(`${value}${suffix}`);
  }
  if (value.length === 13) {
    return parseNumber(value);
  }
  return 0;
}
