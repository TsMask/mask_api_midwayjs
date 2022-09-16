import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { TypeORMDataSourceManager } from '@midwayjs/typeorm';
import { DataSource } from 'typeorm';
import { SysConfig } from '../model/sys_config';
import { SysConfigRepoInterface } from './interfaces/sys_config_repo.interface';

const SELECT_CONFIG_VO = `
select config_id, config_name, config_key, config_value, config_type, create_by, create_time, update_by, update_time, remark 
from sys_config
`;

/**
 * 用户表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysConfigRepo implements SysConfigRepoInterface {
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


  select_config(sys_config: SysConfig): Promise<SysConfig> {
    // let args = {};
    // if(sys_config.config_id){
    //   parameters["config_id"] = sys_config.config_id;
    // }
    // if(sys_config.config_key){
    //   parameters["config_key"] = sys_config.config_key;
    // } 
    return this.dataSource().query(SELECT_CONFIG_VO, []);
    throw new Error('Method not implemented.');
  }
  select_config_list(sys_config: SysConfig): Promise<SysConfig[]> {
    throw new Error('Method not implemented.');
  }
  check_unique_config_key(config_key: string): Promise<SysConfig> {
    throw new Error('Method not implemented.');
  }
  insert_config(sys_config: SysConfig): Promise<number> {
    throw new Error('Method not implemented.');
  }
  update_config(sys_config: SysConfig): Promise<number> {
    throw new Error('Method not implemented.');
  }
  delete_config_by_id(config_id: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  delete_config_by_ids(config_ids: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
   
}
