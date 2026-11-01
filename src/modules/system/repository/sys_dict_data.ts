import { Inject, Provide, Singleton } from '@midwayjs/core';
import {
  DeleteResult,
  EntityManager,
  InsertResult,
  UpdateResult,
} from 'typeorm';
import { ResultSetHeader } from '../../../typings/commont';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysDictData } from '../model/sys_dict_data';

/**字典类型数据表 数据层处理 */
@Provide()
@Singleton()
export class SysDictDataRepository {
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
  ): Promise<[SysDictData[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictData, 's');
    // 查询条件拼接
    if (query.dict_type) {
      tx.andWhere('s.dict_type = :dict_type', {
        dict_type: query.dict_type,
      });
    }
    if (query.data_label) {
      tx.andWhere('s.data_label like :data_label', {
        data_label: query.data_label + '%',
      });
    }
    if (query.data_status) {
      tx.andWhere('s.data_status = :data_status', {
        data_status: query.data_status,
      });
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

    // 排序，格式: sort=create_time,id:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      create_time: 's.create_time',
      update_time: 's.update_time',
      dict_type: 's.dict_type',
      data_sort: 's.data_sort',
      tag_class: 's.tag_class',
      tag_type: 's.tag_type',
      data_status: 's.data_status',
    };
    const orders = this.db.sortParse(query.sort, columnMap);
    this.db.sortOrDefault(tx, orders, 's.data_sort ASC');

    const rows = await tx.getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysDictData 信息
   * @return 列表
   */
  public async select(sysDictData: SysDictData): Promise<SysDictData[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictData, 's');
    // 构建查询条件
    if (sysDictData.data_label) {
      tx.andWhere('s.data_label like :data_label', {
        data_label: sysDictData.data_label + '%',
      });
    }
    if (sysDictData.dict_type) {
      tx.andWhere('s.dict_type = :dict_type', {
        dict_type: sysDictData.dict_type,
      });
    }
    if (sysDictData.data_status) {
      tx.andWhere('s.data_status = :data_status', {
        data_status: sysDictData.data_status,
      });
    }
    // 查询数据
    return await tx.addOrderBy('s.data_sort', 'ASC').getMany();
  }

  /**
   * 通过ID查询
   *
   * @param dataIds ID数组
   * @return 信息
   */
  public async selectByIds(dataIds: number[]): Promise<SysDictData[]> {
    if (dataIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictData, 's')
      .andWhere('s.id in (:dataIds)', { dataIds })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysDictData 信息
   * @return ID
   */
  public async insert(sysDictData: SysDictData): Promise<number> {
    if (sysDictData.create_by) {
      const ms = Date.now();
      sysDictData.update_by = sysDictData.create_by;
      sysDictData.update_time = ms;
      sysDictData.create_time = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysDictData)
      .values(sysDictData)
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
   * @param sysDictData 信息
   * @return 影响记录数
   */
  public async update(sysDictData: SysDictData): Promise<number> {
    if (sysDictData.id <= 0) {
      return 0;
    }
    if (sysDictData.update_by) {
      sysDictData.update_time = Date.now();
    }
    const data = Object.assign({}, sysDictData);
    delete (data as Partial<SysDictData>).id;
    delete (data as Partial<SysDictData>).create_by;
    delete (data as Partial<SysDictData>).create_time;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDictData)
      .set(data)
      .andWhere('id = :id', { id: sysDictData.id })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量删除
   *
   * @param dataIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(dataIds: number[]): Promise<number> {
    if (dataIds.length === 0) return 0;
    // Gin uses physical deletion for dictionary data.
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysDictData)
      .andWhere('id in (:dataIds)', { dataIds })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysDictData 信息
   * @returns
   */
  public async checkUnique(sysDictData: SysDictData): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictData, 's');
    // 查询条件拼接
    if (sysDictData.dict_type) {
      tx.andWhere('s.dict_type = :dict_type', {
        dict_type: sysDictData.dict_type,
      });
    }
    if (sysDictData.data_label) {
      tx.andWhere('s.data_label = :data_label', {
        data_label: sysDictData.data_label,
      });
    }
    if (sysDictData.data_value) {
      tx.andWhere('s.data_value = :data_value', {
        data_value: sysDictData.data_value,
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
   * 存在数据数量
   *
   * @param dict_type 字典类型
   * @return 数量
   */
  public async existDataByDictType(dict_type: string): Promise<number> {
    if (!dict_type) {
      return 0;
    }
    // 查询数据
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictData, 's')
      .andWhere('s.dict_type = :dict_type', { dict_type })
      .getCount();
    return count;
  }

  /**
   * 更新一组字典类型
   *
   * @param oldDictType 旧字典类型
   * @param newDictType 新字典类型
   * @return 影响记录数
   */
  public async updateDataByDictType(
    oldDictType: string,
    newDictType: string,
    entityManager?: EntityManager
  ): Promise<number> {
    if (!oldDictType || !newDictType) {
      return 0;
    }
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysDictData,
        { dict_type: oldDictType },
        { dict_type: newDictType }
      );
      return result.affected ?? 0;
    }
    // 执行更新状态标记
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDictData)
      .set({ dict_type: newDictType })
      .andWhere('dict_type = :oldDictType', { oldDictType })
      .execute();
    return tx.affected ?? 0;
  }
}
