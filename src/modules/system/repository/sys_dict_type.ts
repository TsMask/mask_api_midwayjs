import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
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
      .from(SysDictType, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (query.dictName) {
      tx.andWhere('s.dict_name like :dictName', {
        dictName: query.dictName + '%',
      });
    }
    if (query.dictType) {
      tx.andWhere('s.dict_type like :dictType', {
        dictType: query.dictType + '%',
      });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
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
    let rows: SysDictType[] = [];

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
   * @param sysDictType 信息
   * @return 列表
   */
  public async select(sysDictType: SysDictType): Promise<SysDictType[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictType, 's')
      .andWhere("s.del_flag = '0'");
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
    if (sysDictType.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysDictType.statusFlag,
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
      .andWhere("s.dict_id in (:dictIds) and s.del_flag = '0'", { dictIds })
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
    sysDictType.delFlag = '0';
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
    if (sysDictType.dictId <= 0) {
      return 0;
    }
    if (sysDictType.updateBy) {
      sysDictType.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysDictType);
    delete data.dictId;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDictType)
      .set(data)
      .andWhere('dict_id = :dictId', { dictId: sysDictType.dictId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param dictIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(dictIds: number[]): Promise<number> {
    if (dictIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysDictType)
      .set({ delFlag: '1' })
      .andWhere('dict_id in (:dictIds)', { dictIds })
      .execute();
    return tx.affected;
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
      .from(SysDictType, 's')
      .andWhere("s.del_flag = '0'");
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
    return item.dictId;
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
      .andWhere("s.del_flag = '0'")
      .andWhere('s.dict_type = :dictType', { dictType })
      .getOne();
    if (!item) {
      return new SysDictType();
    }
    return item;
  }
}
