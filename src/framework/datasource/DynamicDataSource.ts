import { Provide, Inject, Singleton } from '@midwayjs/core';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { DataSource, QueryRunner } from 'typeorm';
import { parseNumber } from '../utils/ValueParseUtils';

/**
 * 动态数据源
 *
 * @author TsMask
 */
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
  public dataSource(source = 'default'): DataSource {
    return this.dataSourceManager.getDataSource(source);
  }

  /**
   * 获取可用数据源名称
   * @return 数据源名称
   */
  public dataSourceNames(): string[] {
    return this.dataSourceManager.getDataSourceNames();
  }

  /**
   * 执行sql语句
   *
   * 使用后自动释放连接
   *
   * @param sql sql预编译语句
   * @param parameters 预编译?参数
   * @param source 数据源 默认'default'
   * @returns 查询结果或异常错误
   */
  public execute(
    sql: string,
    parameters?: any[],
    source = 'default'
  ): Promise<any> {
    sql = sql.replace(/\s+/g, ' ');
    return this.dataSource(source).query(sql, parameters);
  }

  /**
   * 事务执行sql语句
   *
   * 创建和控制单个数据库连接的状态, 允许控制事务但需要使用后手动释放连接
   *
   * startTransaction - 在查询运行器实例中启动一个新事务。
   *
   * commitTransaction - 提交使用查询运行器实例所做的所有更改。
   *
   * rollbackTransaction - 回滚使用查询运行程序实例所做的所有更改。
   *
   * release - 释放连接
   *
   * @param source 数据源 默认'default'
   * @returns 查询结果或异常错误
   */
  public executeRunner(source = 'default'): QueryRunner {
    return this.dataSource(source).createQueryRunner();
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

  /**
   * 查询-参数值的占位符
   * @param sum 数量
   * @returns 占位符字符串 "?,?"
   */
  public keyPlaceholderByQuery(sum: number): string {
    const placeholders = Array.from({ length: sum }, () => '?');
    return placeholders.join(',');
  }

  /**
   * 插入-键值数据与参数映射键值占位符
   * @param params 键值参数
   * @returns [keys, placeholder, values]
   */
  public keyValuePlaceholderByInsert(
    params: Map<string, any>
  ): [string, any[], string] {
    // 参数映射的键
    const keys = [...params.keys()].join(',');
    // 参数映射的值
    const values = [...params.values()];
    // 参数值的占位符
    const placeholders = Array.from({ length: params.size }, () => '?');

    return [keys, values, placeholders.join(',')];
  }

  /**
   * 更新-键值数据
   * @param params 键值参数
   * @returns [keys, values]
   */
  public keyValueByUpdate(params: Map<string, any>): [string, any[]] {
    // 参数映射的键
    const keys = [...params.keys()].map(k => k + '=?').join(',');
    // 参数映射的值
    const values = [...params.values()];

    return [keys, values];
  }
}
