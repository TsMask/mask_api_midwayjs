import { Provide, Inject, Singleton } from '@midwayjs/core';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { DataSource, EntityManager, SelectQueryBuilder } from 'typeorm';

import { parseNumber } from '../../shared/parse/parse';

/**动态数据源 */
@Provide()
@Singleton()
export class DynamicDataSource {
  @Inject()
  private dataSourceManager: TypeORMDataSourceManager;

  /**
   * 数据源
   * @param source 数据库连接
   * @return 连接实例
   */
  public db(source: string): DataSource {
    if (!source) {
      source = 'default';
    }
    return this.dataSourceManager.getDataSource(source);
  }

  /**
   * 获取可用数据源名称
   * @return 数据源名称
   */
  public names(): string[] {
    return this.dataSourceManager.getDataSourceNames();
  }

  /**
   * 原生语句查询和执行
   *
   * 使用后自动释放连接
   *
   * @param source 数据源 空字符默认'default'
   * @param sql sql预编译语句
   * @param parameters 预编译?参数
   * @returns 查询结果或异常错误
   */
  public execute<T>(
    source: string,
    sql: string,
    parameters?: any[]
  ): Promise<any> {
    const db = this.db(source);
    // 使用正则表达式替换连续的空白字符为单个空格
    sql = sql.replace(/\s+/g, ' ');
    // 查询结果
    return db.query<T>(sql, parameters);
  }

  /**
   * 查询构造器
   *
   * 创建和控制单个数据库连接的状态, 允许控制事务但需要使用后手动释放连接
   *
   * @param source 数据源 空字符默认'default'
   * @returns 查询结果或异常错误
   */
  public queryBuilder(source: string): SelectQueryBuilder<any> {
    const db = this.db(source);
    return db.createQueryBuilder();
  }

  /**
   * 事务执行
   *
   * 所有在回调内的数据库操作共享同一事务上下文
   *
   * @param source 数据源 空字符默认'default'
   * @param run 事务内执行的异步回调，接收 EntityManager
   * @returns 回调返回值
   */
  public async transaction<T>(
    source: string,
    run: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    const ds = this.db(source);
    return ds.transaction(run);
  }

  /**
   * 分页页码记录数
   * @param pageNum 页码
   * @param pageSize 单页记录数
   * @returns [起始页码,单页记录数]
   */
  public pageNumSize(
    pageNum: string | number,
    pageSize: string | number
  ): [number, number] {
    // 记录起始索引
    let num = parseNumber(pageNum);
    if (num < 1) {
      num = 1;
    }

    // 显示记录数
    let size = parseNumber(pageSize);
    if (size <= 0) {
      size = 10;
    }

    // 最大分页限制
    if (size > 500) {
      size = 500;
    }
    return [num - 1, size];
  }

  /**
   * 解析统一排序字符串
   *
   * 格式: sort=field1,field2:asc,field3:desc
   *
   * 不加方向默认 DESC，方向不区分大小写；未匹配字段直接忽略
   *
   * @param sort 排序字符串
   * @param fieldMapping 前端字段与数据库字段映射
   * @returns 排序项
   */
  public sortParse(
    sort: string | undefined,
    fieldMapping: Record<string, string>
  ): Array<{ field: string; asc: boolean }> {
    if (!sort) {
      return [];
    }
    const orders: Array<{ field: string; asc: boolean }> = [];
    for (const part of sort.split(',')) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const [field, rawDirection = ''] = trimmed.split(':');
      const key = field.trim();
      const mapped = fieldMapping[key];
      if (!mapped) continue;
      orders.push({
        field: mapped,
        asc: rawDirection.trim().toLowerCase() === 'asc',
      });
    }
    return orders;
  }

  /**
   * 应用排序项，无排序项时使用默认排序
   *
   * @param tx 查询构造器
   * @param orders 排序项
   * @param defaultOrder 默认排序，格式: field asc|desc
   * @returns 查询构造器
   */
  public sortOrDefault(
    tx: SelectQueryBuilder<any>,
    orders: Array<{ field: string; asc: boolean }>,
    defaultOrder: string
  ): SelectQueryBuilder<any> {
    if (orders.length > 0) {
      for (const order of orders) {
        tx.addOrderBy(order.field, order.asc ? 'ASC' : 'DESC');
      }
      return tx;
    }

    const match = defaultOrder.trim().match(/^([\w.]+)\s+(asc|desc)$/i);
    if (!match) {
      throw new Error(`invalid default order: ${defaultOrder}`);
    }
    tx.addOrderBy(match[1], match[2].toUpperCase() as 'ASC' | 'DESC');
    return tx;
  }
}
