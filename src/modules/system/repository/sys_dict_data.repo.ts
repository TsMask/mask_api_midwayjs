import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { SysDictData } from '../../../common/core/model/sys_dict_data';
import { SysDictDataRepoInterface } from './interfaces/sys_dict_data_repo.interface';

const SELECT_DICT_DATA_VO = `
select dict_code, dict_sort, dict_label, dict_value, dict_type, css_class, list_class, is_default, status, create_by, create_time, remark 
from sys_dict_data
`;

/**
 * 用户表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDictDataRepo implements SysDictDataRepoInterface {
  @Inject()
  dataSourceManager: TypeORMDataSourceManager;

  /**
   * 数据源
   * @param source 数据库连接
   * @returns 连接实例
   */
  dataSource(source: string = 'default'): DataSource {
    return this.dataSourceManager.getDataSource(source);
  }

  select_dict_data_list(sys_dict_data: SysDictData): Promise<SysDictData[]> {
    throw new Error('Method not implemented.');
  }
  select_dict_data_by_type(dict_type: string): Promise<SysDictData[]> {
    throw new Error('Method not implemented.');
  }
  select_dict_label(dict_type: string, dict_value: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  select_dict_data_by_id(dict_code: string): Promise<SysDictData> {
    const sql = `${SELECT_DICT_DATA_VO} where dict_code = ?`;
    return this.dataSource().query(sql, [dict_code]);
  }

  count_dict_data_by_type(dict_type: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  delete_dict_data_by_id(dict_code: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  delete_dict_data_by_ids(dict_codes: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  insert_dict_data(sys_dict_data: SysDictData): Promise<number> {
    throw new Error('Method not implemented.');
  }
  update_dict_data(sys_dict_data: SysDictData): Promise<number> {
    throw new Error('Method not implemented.');
  }
  update_dict_data_type(
    old_dict_type: string,
    new_dict_type: string
  ): Promise<number> {
    throw new Error('Method not implemented.');
  }
}
