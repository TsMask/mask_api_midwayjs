import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
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
      .from(SysDictData, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (query.dictType) {
      tx.andWhere('s.dict_type = :dictType', {
        dictType: query.dictType,
      });
    }
    if (query.dataLabel) {
      tx.andWhere('s.data_label like :dataLabel', {
        dataLabel: query.dataLabel + '%',
      });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }

    // 查询结果
    let total = 0;
    let rows: SysDictData[] = [];

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
   * @param sysDictData 信息
   * @return 列表
   */
  public async select(sysDictData: SysDictData): Promise<SysDictData[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictData, 's')
      .andWhere("s.del_flag = '0'");
    // 构建查询条件
    if (sysDictData.dataLabel) {
      tx.andWhere('s.data_label like :dataLabel', {
        dataLabel: sysDictData.dataLabel + '%',
      });
    }
    if (sysDictData.dictType) {
      tx.andWhere('s.dict_type = :dictType', {
        dictType: sysDictData.dictType,
      });
    }
    if (sysDictData.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysDictData.statusFlag,
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
      .andWhere("s.data_id in (:dataIds) and s.del_flag = '0'", { dataIds })
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
    sysDictData.delFlag = '0';
    if (sysDictData.createBy) {
      const ms = Date.now().valueOf();
      sysDictData.updateBy = sysDictData.createBy;
      sysDictData.updateTime = ms;
      sysDictData.createTime = ms;
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
    if (sysDictData.dataId <= 0) {
      return 0;
    }
    if (sysDictData.updateBy) {
      sysDictData.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysDictData);
    delete data.dataId;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDictData)
      .set(data)
      .andWhere('data_id = :dataId', { dataId: sysDictData.dataId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param dataIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(dataIds: number[]): Promise<number> {
    if (dataIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysDictData)
      .set({ delFlag: '1' })
      .andWhere('data_id in (:dataIds)', { dataIds })
      .execute();
    return tx.affected;
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
      .from(SysDictData, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (sysDictData.dictType) {
      tx.andWhere('s.dict_type = :dictType', {
        dictType: sysDictData.dictType,
      });
    }
    if (sysDictData.dataLabel) {
      tx.andWhere('s.data_label = :dataLabel', {
        dataLabel: sysDictData.dataLabel,
      });
    }
    if (sysDictData.dataValue) {
      tx.andWhere('s.data_value = :dataValue', {
        dataValue: sysDictData.dataValue,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.dataId;
  }

  /**
   * 存在数据数量
   *
   * @param dictType 字典类型
   * @return 数量
   */
  public async existDataByDictType(dictType: string): Promise<number> {
    if (!dictType) {
      return 0;
    }
    // 查询数据
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysDictData, 's')
      .andWhere("s.del_flag = '0'")
      .andWhere('s.dict_type = :dictType', { dictType })
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
    newDictType: string
  ): Promise<number> {
    if (!oldDictType || !newDictType) {
      return 0;
    }
    // 执行更新状态标记
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysDictData)
      .set({ dictType: newDictType })
      .andWhere('dict_type = :oldDictType', { oldDictType })
      .execute();
    return tx.affected;
  }
}
