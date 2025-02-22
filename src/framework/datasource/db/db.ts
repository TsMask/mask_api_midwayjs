import { Provide, Inject, Singleton } from '@midwayjs/core';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';

import { parseNumber } from '../../utils/parse/parse';

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
    if (size < 0) {
      size = 10;
    }
    return [num - 1, size];
  }
}
