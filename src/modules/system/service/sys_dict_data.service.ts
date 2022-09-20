import { Provide, Inject } from '@midwayjs/decorator';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { SysDictData } from '../../../framework/core/model/sys_dict_data';
import { SysDictDataRepo } from '../repository/sys_dict_data.repo';
import { SysDictDataServiceInterface } from './interfaces/sys_dict_data_service.interface';

/**
 * 用户 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysDictDataService implements SysDictDataServiceInterface {
  @Inject()
  dataSourceManager: TypeORMDataSourceManager;

  @Inject()
  sys_dict_data_repo: SysDictDataRepo;

  select_dict_data_list(sys_dict_data: SysDictData): Promise<SysDictData[]> {
    throw new Error('Method not implemented.');
  }
  select_dict_label(dict_type: string, dict_value: string): Promise<string> {
    throw new Error('Method not implemented.');
  }
  select_dict_data_by_id(dict_code: string): Promise<SysDictData> {
    return this.sys_dict_data_repo.select_dict_data_by_id(dict_code);
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
}
