import { SysDictData } from '../../../../common/core/model/sys_dict_data';

/**
 * 字典表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysDictDataRepoInterface {
  /**
   * 根据条件分页查询字典数据
   *
   * @param sys_dict_data 字典数据信息
   * @return 字典数据集合信息
   */
  select_dict_data_list(sys_dict_data: SysDictData): Promise<SysDictData[]>;

  /**
   * 根据字典类型查询字典数据
   *
   * @param dict_type 字典类型
   * @return 字典数据集合信息
   */
  select_dict_data_by_type(dict_type: string): Promise<SysDictData[]>;

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
   * @param dictCode 字典数据ID
   * @return 字典数据
   */
  select_dict_data_by_id(dict_code: string): Promise<SysDictData>;

  /**
   * 查询字典数据
   *
   * @param dict_type 字典类型
   * @return 字典数据
   */
  count_dict_data_by_type(dict_type: string): Promise<number>;

  /**
   * 通过字典ID删除字典数据信息
   *
   * @param dict_code 字典数据ID
   * @return 结果
   */
  delete_dict_data_by_id(dict_code: string): Promise<number>;

  /**
   * 批量删除字典数据信息
   *
   * @param dict_codes 需要删除的字典数据ID
   * @return 结果
   */
  delete_dict_data_by_ids(dict_codes: string[]): Promise<number>;

  /**
   * 新增字典数据信息
   *
   * @param sys_dict_data 字典数据信息
   * @return 结果
   */
  insert_dict_data(sys_dict_data: SysDictData): Promise<number>;

  /**
   * 修改字典数据信息
   *
   * @param sys_dict_data 字典数据信息
   * @return 结果
   */
  update_dict_data(sys_dict_data: SysDictData): Promise<number>;

  /**
   * 同步修改字典类型
   *
   * @param old_dict_type 旧字典类型
   * @param new_dict_type 新旧字典类型
   * @return 结果
   */
  update_dict_data_type(
    old_dict_type: string,
    new_dict_type: string
  ): Promise<number>;
}
