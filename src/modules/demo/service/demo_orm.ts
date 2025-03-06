import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';
import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { DemoORM } from '../model/demo_orm';

/**
 * 测试ORM信息
 */
@Provide()
@Singleton()
export class DemoORMService {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 分页查询
   * @param query 参数
   * @returns
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[DemoORM[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('d')
      .from(DemoORM, 'd');
    // 查询条件拼接
    if (query.title) {
      tx.andWhere('d.title like :title', { title: query.title + '%' });
    }
    if (query.statusFlag) {
      tx.andWhere('d.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }

    // 查询结果
    let total = 0;
    let rows: DemoORM[] = [];

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
   * @param param 信息
   * @return 列表
   */
  public async find(param: DemoORM): Promise<DemoORM[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('d')
      .from(DemoORM, 'd');
    // 构建查询条件
    if (param.title) {
      tx.andWhere('d.title like :title', { title: param.title + '%' });
    }
    if (param.statusFlag) {
      tx.andWhere('d.status_flag = :statusFlag', {
        statusFlag: param.statusFlag,
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param id ID
   * @return 信息
   */
  public async findById(id: number): Promise<DemoORM> {
    if (id <= 0) {
      return new DemoORM();
    }
    // 查询数据
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('d')
      .from(DemoORM, 'd')
      .andWhere('d.id = :id', { id })
      .getOne();
    if (!item) {
      return new DemoORM();
    }
    return item;
  }

  /**
   * 新增
   *
   * @param param 信息
   * @return ID
   */
  public async insert(param: DemoORM): Promise<number> {
    param.createBy = 'system';
    param.createTime = Date.now().valueOf();
    param.updateBy = param.createBy;
    param.updateTime = param.createTime;
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(DemoORM)
      .values(param)
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
   * @param param 信息
   * @return 影响记录数
   */
  public async update(param: DemoORM): Promise<number> {
    if (param.id <= 0) {
      return 0;
    }
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('d')
      .from(DemoORM, 'd')
      .andWhere('d.id = :id', { id: param.id })
      .getOne();
    if (!item) return 0;

    // 只改某些属性
    const setColumns = {
      title: param.title,
      ormType: param.ormType,
      statusFlag: param.statusFlag,
      remark: param.remark,
      updateBy: 'system',
      updateTime: Date.now().valueOf(),
    };
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(DemoORM)
      .set(setColumns)
      .andWhere('id = :id', { id: item.id })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param ids ID数组
   * @return 影响记录数
   */
  public async deleteByIds(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(DemoORM)
      .andWhere('id in (:ids)', { ids })
      .execute();
    return tx.affected;
  }

  /**
   * 清空测试ORM表
   * @return 删除记录数
   */
  public async clean(): Promise<number> {
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(DemoORM)
      .execute();
    return tx.affected;
  }
}
