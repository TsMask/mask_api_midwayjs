import { SysDictData } from '../../../../common/core/model/sys_dict_data';

/**
 * 字典类型数据 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysDictDataServiceInterface {
  /**
   * 根据条件分页查询字典数据
   *
   * @param sys_dict_data 字典数据信息
   * @return 字典数据集合信息
   */
  select_dict_data_list(sys_dict_data: SysDictData): Promise<SysDictData[]>;

  /**
   * 根据字典类型和字典键值查询字典数据信息
   *
   * @param dict_type 字典类型
   * @param dict_value 字典键值
   * @return 字典标签
   */
  select_dict_label(dict_type: string, dict_value: string): Promise<string>;

  /**
   * 根据字典数据ID查询信息
   *
   * @param dict_code 字典数据ID
   * @return 字典数据
   */
  select_dict_data_by_id(dict_code: string): Promise<SysDictData>;

  /**
   * 批量删除字典数据信息
   *
   * @param dict_codes 需要删除的字典数据ID
   */
  delete_dict_data_by_ids(dict_codes: string[]): Promise<number>;

  /**
   * 新增保存字典数据信息
   *
   * @param sys_dict_data 字典数据信息
   * @return 结果
   */
  insert_dict_data(sys_dict_data: SysDictData): Promise<number>;

  /**
   * 修改保存字典数据信息
   *
   * @param sys_dict_data 字典数据信息
   * @return 结果
   */
  update_dict_data(sys_dict_data: SysDictData): Promise<number>;
}
