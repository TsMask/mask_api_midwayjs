import { PageBody } from '../../../../framework/core/page_body';
import { PageData } from '../../../../framework/core/page_data';
import { SysConfig } from '../../model/sys_config';

/**
 * 参数配置 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysConfigRepoInterface {
  /**
   * 查询参数配置列表数据
   *
   * @param page_body 请求参数
   * @return 列表数据结果
   */
  select_config_page(
    page_body: PageBody<SysConfig>
  ): Promise<PageData<SysConfig>>;

  /**
   * 查询参数配置列表
   *
   * @param sys_config 参数配置信息
   * @return 参数配置集合
   */
  select_config_list(sys_config: SysConfig): Promise<SysConfig[]>;

  /**
   * 查询参数配置信息
   *
   * @param sys_config 参数配置信息
   * @return 参数配置信息
   */
  select_config(sys_config: SysConfig): Promise<SysConfig>;

  /**
   * 根据键名查询参数配置信息
   *
   * @param config_key 参数键名
   * @return 参数配置信息
   */
  check_unique_config_key(config_key: string): Promise<SysConfig>;

  /**
   * 新增参数配置
   *
   * @param sys_config 参数配置信息
   * @return 结果
   */
  insert_config(sys_config: SysConfig): Promise<number>;

  /**
   * 修改参数配置
   *
   * @param sys_config 参数配置信息
   * @return 结果
   */
  update_config(sys_config: SysConfig): Promise<number>;

  /**
   * 删除参数配置
   *
   * @param config_id 参数ID
   * @return 结果
   */
  delete_config_by_id(config_id: number): Promise<boolean>;
}
