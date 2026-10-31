import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';
import { ResultSetHeader } from '../../../typings/commont';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { SysDictType } from '../model/sys_dict_type';

/**字典类型表 数据层处理 */
@Provide()
@Singleton()
export class SysDictTypeRepository {
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
  ): Promise<[SysDictType[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictType, 's');
    // 查询条件拼接
    if (query.dict_name) {
      tx.andWhere('s.dict_name like :dictName', {
        dictName: query.dict_name + '%',
      });
    }
    if (query.dict_type) {
      tx.andWhere('s.dict_type like :dictType', {
        dictType: query.dict_type + '%',
      });
    }
    if (query.dict_status) {
      tx.andWhere('s.dict_status = :dictStatus', {
        dictStatus: query.dict_status,
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
          endTime: parseNumber(`${query.create_time_end}999`),
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
      query.page_num,
      query.page_size
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    // 排序，格式: sort=createTime,dictName:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      create_time: 's.create_time',
      update_time: 's.update_time',
      dict_name: 's.dict_name',
      dict_type: 's.dict_type',
      dict_status: 's.dict_status',
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
   * @param sysDictType 信息
   * @return 列表
   */
  public async select(sysDictType: SysDictType): Promise<SysDictType[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictType, 's');
    // 构建查询条件
    if (sysDictType.dictName) {
      tx.andWhere('s.dict_name like :dictName', {
        dictName: sysDictType.dictName + '%',
      });
    }
    if (sysDictType.dictType) {
      tx.andWhere('s.dict_type like :dictType', {
        dictType: sysDictType.dictType + '%',
      });
    }
    if (sysDictType.dictStatus) {
      tx.andWhere('s.dict_status = :dictStatus', {
        dictStatus: sysDictType.dictStatus,
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param dictIds ID数组
   * @return 信息
   */
  public async selectByIds(dictIds: number[]): Promise<SysDictType[]> {
    if (dictIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictType, 's')
      .andWhere('s.id in (:dictIds)', { dictIds })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysDictType 信息
   * @return ID
   */
  public async insert(sysDictType: SysDictType): Promise<number> {
    if (sysDictType.createBy) {
      const ms = Date.now().valueOf();
      sysDictType.updateBy = sysDictType.createBy;
      sysDictType.updateTime = ms;
      sysDictType.createTime = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysDictType)
      .values(sysDictType)
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
   * @param sysDictType 信息
   * @return 影响记录数
   */
  public async update(sysDictType: SysDictType): Promise<number> {
    if (sysDictType.id <= 0) {
      return 0;
    }
    if (sysDictType.updateBy) {
      sysDictType.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysDictType);
    delete (data as Partial<SysDictType>).id;
    delete (data as Partial<SysDictType>).createBy;
    delete (data as Partial<SysDictType>).createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDictType)
      .set(data)
      .andWhere('id = :id', { id: sysDictType.id })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量删除
   *
   * @param dictIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(dictIds: number[]): Promise<number> {
    if (dictIds.length === 0) return 0;
    // Gin uses physical deletion for dictionary types.
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysDictType)
      .andWhere('id in (:dictIds)', { dictIds })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysDictType 信息
   * @returns
   */
  public async checkUnique(sysDictType: SysDictType): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictType, 's');
    // 查询条件拼接
    if (sysDictType.dictName) {
      tx.andWhere('s.dict_name = :dictName', {
        dictName: sysDictType.dictName,
      });
    }
    if (sysDictType.dictType) {
      tx.andWhere('s.dict_type = :dictType', {
        dictType: sysDictType.dictType,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.id;
  }

  /**
   * 通过字典类型查询信息
   *
   * @param dictType 字典类型
   * @return 数量
   */
  public async selectByType(dictType: string): Promise<SysDictType> {
    if (!dictType) {
      return new SysDictType();
    }
    // 查询数据
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictType, 's')
      .andWhere('s.dict_type = :dictType', { dictType })
      .getOne();
    if (!item) {
      return new SysDictType();
    }
    return item;
  }
}
