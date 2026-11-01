import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { ResultSetHeader } from '../../../typings/commont';
import { DemoORM } from '../model/demo_orm';

/**测试ORM表 数据层处理 */
@Provide()
@Singleton()
export class DemoORMRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 分页查询
   *
   * @param query 参数
   * @returns [集合, 总数]
   */
  public async selectByPage(
    query: Record<string, string>
  ): Promise<[DemoORM[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('d')
      .from(DemoORM, 'd');
    if (query.title) {
      tx.andWhere('d.title like :title', { title: query.title + '%' });
    }
    if (query.orm_status) {
      tx.andWhere('d.orm_status = :ormStatus', {
        ormStatus: query.orm_status,
      });
    }

    const total = await tx.getCount();
    if (total <= 0) {
      return [[], total];
    }

    const pageNum = Math.max(Math.trunc(parseNumber(query.page_num)), 1) - 1;
    let pageSize = Math.trunc(parseNumber(query.page_size));
    if (pageSize <= 0) {
      pageSize = 10;
    }
    if (pageSize > 200) {
      pageSize = 200;
    }
    tx.skip(pageSize * pageNum).take(pageSize);

    const columnMap: Record<string, string> = {
      id: 'd.id',
      create_time: 'd.create_time',
      update_time: 'd.update_time',
      title: 'd.title',
      orm_type: 'd.orm_type',
      orm_status: 'd.orm_status',
    };
    
    // 排序
    const orders = this.db.sortParse(query.sort, columnMap);
    this.db.sortOrDefault(tx, orders, 'd.id DESC');

    const rows = await tx.getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param demoORM 信息
   * @returns 集合
   */
  public async select(demoORM: DemoORM): Promise<DemoORM[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('d')
      .from(DemoORM, 'd');
    if (demoORM.title) {
      tx.andWhere('d.title like :title', { title: demoORM.title + '%' });
    }
    if (demoORM.ormStatus) {
      tx.andWhere('d.orm_status = :ormStatus', {
        ormStatus: demoORM.ormStatus,
      });
    }
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param id ID
   * @returns 信息
   */
  public async selectById(id: number): Promise<DemoORM> {
    if (id <= 0) {
      return new DemoORM();
    }
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('d')
      .from(DemoORM, 'd')
      .andWhere('d.id = :id', { id })
      .getOne();
    return item ?? new DemoORM();
  }

  /**
   * 新增
   *
   * @param demoORM 信息
   * @returns ID
   */
  public async insert(demoORM: DemoORM): Promise<number> {
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(DemoORM)
      .values(demoORM)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    return raw.insertId > 0 ? raw.insertId : 0;
  }

  /**
   * 更新
   *
   * @param demoORM 信息
   * @returns 影响记录数
   */
  public async update(demoORM: DemoORM): Promise<number> {
    if (demoORM.id <= 0) {
      return 0;
    }
    const data = Object.assign({}, demoORM) as Partial<DemoORM>;
    delete data.id;
    delete data.createBy;
    delete data.createTime;
    const values = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== '' && value !== 0)
    );

    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(DemoORM)
      .set(values)
      .andWhere('id = :id', { id: demoORM.id })
      .execute();
    return tx.affected || 0;
  }

  /**
   * 批量删除
   *
   * @param ids ID数组
   * @returns 影响记录数
   */
  public async deleteByIds(ids: number[]): Promise<number> {
    if (ids.length <= 0) {
      return 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(DemoORM)
      .andWhere('id in (:ids)', { ids })
      .execute();
    return tx.affected || 0;
  }

  /**
   * 清空测试ORM表
   *
   * @returns 影响记录数
   */
  public async clean(): Promise<number> {
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(DemoORM)
      .andWhere('1 = 1')
      .execute();
    return tx.affected || 0;
  }
}
