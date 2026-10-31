import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { ResultSetHeader } from '../../../typings/commont';
import { SysLoginLog } from '../model/sys_login_log';

/**系统登录日志表 数据层处理 */
@Provide()
@Singleton()
export class SysLoginLogRepository {
  @Inject()
  private db: DynamicDataSource;

  public async selectByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysLoginLog[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysLoginLog, 's');
    if (query.login_ip) {
      tx.andWhere('s.login_ip like :loginIp', {
        loginIp: query.login_ip + '%',
      });
    }
    if (query.login_user_name) {
      tx.andWhere('s.login_user_name like :loginUserName', {
        loginUserName: query.login_user_name + '%',
      });
    }
    if (query.login_status) {
      tx.andWhere('s.login_status = :loginStatus', {
        loginStatus: query.login_status,
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
        `s.login_user_name in (select distinct user_name from sys_user where ${filter.sql})`,
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
      create_time: 's.create_time',
      login_ip: 's.login_ip',
      login_user_name: 's.login_user_name',
      login_status: 's.login_status',
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

  public async insert(loginLog: SysLoginLog): Promise<number> {
    loginLog.createTime = Date.now();
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysLoginLog)
      .values(loginLog)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    return raw.insertId > 0 ? raw.insertId : 0;
  }

  public async clean(): Promise<number> {
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysLoginLog)
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
