import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { ResultSetHeader } from '../../../typings/commont';
import { SysConfig } from '../model/sys_config';

/**参数配置表 数据层处理 */
@Provide()
@Singleton()
export class SysConfigRepository {
  @Inject()
  private db: DynamicDataSource;

  public async selectByPage(
    query: Record<string, string>
  ): Promise<[SysConfig[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's');
    if (query.config_name) {
      tx.andWhere('s.config_name like :config_name', {
        config_name: query.config_name + '%',
      });
    }
    if (query.config_group) {
      tx.andWhere('s.config_group = :config_group', {
        config_group: query.config_group,
      });
    }
    if (query.config_key) {
      tx.andWhere('s.config_key like :config_key', {
        config_key: query.config_key + '%',
      });
    }
    if (query.create_time_begin) {
      const beginTime = normalizeTimeRange(query.create_time_begin, '000');
      if (beginTime > 0) {
        tx.andWhere('s.create_time >= :beginTime', { beginTime });
      }
    }
    if (query.create_time_end) {
      const endTime = normalizeTimeRange(query.create_time_end, '999');
      if (endTime > 0) {
        tx.andWhere('s.create_time <= :endTime', { endTime });
      }
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

    // 排序，格式: sort=create_time,id:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      create_time: 's.create_time',
      update_time: 's.update_time',
      config_name: 's.config_name',
      config_key: 's.config_key',
      config_group: 's.config_group',
      config_sort: 's.config_sort',
      config_status: 's.config_status',
    };
    const orders = this.db.sortParse(query.sort, columnMap);
    this.db.sortOrDefault(tx, orders, 's.config_sort ASC');

    const rows = await tx.getMany();
    return [rows, total];
  }

  public async select(sysConfig: SysConfig): Promise<SysConfig[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's');
    if (sysConfig.config_name) {
      tx.andWhere('s.config_name like :config_name', {
        config_name: sysConfig.config_name + '%',
      });
    }
    if (sysConfig.config_group) {
      tx.andWhere('s.config_group = :config_group', {
        config_group: sysConfig.config_group,
      });
    }
    if (sysConfig.config_key) {
      tx.andWhere('s.config_key like :config_key', {
        config_key: sysConfig.config_key + '%',
      });
    }
    if (sysConfig.create_time > 0) {
      tx.andWhere('s.create_time >= :create_time', {
        create_time: sysConfig.create_time,
      });
    }
    return await tx.getMany();
  }

  public async selectByIds(ids: number[]): Promise<SysConfig[]> {
    if (ids.length <= 0) {
      return [];
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysConfig, 's')
      .andWhere('s.id in (:ids)', { ids })
      .getMany();
  }

  public async insert(sysConfig: SysConfig): Promise<number> {
    if (sysConfig.create_by) {
      const ms = Date.now();
      sysConfig.update_by = sysConfig.create_by;
      sysConfig.update_time = ms;
      sysConfig.create_time = ms;
    }
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysConfig)
      .values(sysConfig)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    return raw.insertId > 0 ? raw.insertId : 0;
  }

  public async update(sysConfig: SysConfig): Promise<number> {
    if (sysConfig.id <= 0) {
      return 0;
    }
    if (sysConfig.update_by) {
      sysConfig.update_time = Date.now();
    }
    const data: Partial<SysConfig> = Object.assign({}, sysConfig);
    delete data.id;
    delete data.create_by;
    delete data.create_time;
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysConfig)
      .set(data)
      .where('id = :id', { id: sysConfig.id })
      .execute();
    return tx.affected ?? 0;
  }

  public async deleteByIds(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysConfig)
      .where('id in (:ids)', { ids })
      .execute();
    return tx.affected ?? 0;
  }

  public async checkUnique(sysConfig: SysConfig): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysConfig, 's');
    if (sysConfig.config_group) {
      tx.andWhere('s.config_group = :config_group', {
        config_group: sysConfig.config_group,
      });
    }
    if (sysConfig.config_key) {
      tx.andWhere('s.config_key = :config_key', {
        config_key: sysConfig.config_key,
      });
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async selectValueByKey(config_key: string): Promise<string> {
    if (!config_key) return '';
    const row = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.config_value', 'config_value')
      .from(SysConfig, 's')
      .andWhere('s.config_key = :config_key', { config_key })
      .getRawOne();
    return row?.config_value ?? '';
  }
}

function normalizeTimeRange(value: string, suffix: string): number {
  if (value.length === 10) {
    return parseNumber(`${value}${suffix}`);
  }
  if (value.length === 13) {
    return parseNumber(value);
  }
  return 0;
}
