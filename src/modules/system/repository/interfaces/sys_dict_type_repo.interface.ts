import { SysDictType } from '../../../../common/core/model/sys_dict_type';

/**
 * 字典表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysDictTypeRepoInterface {
  /**
   * 根据条件分页查询字典类型
   *
   * @param sys_dict_type 字典类型信息
   * @return 字典类型集合信息
   */
  select_dict_type_list(sys_dict_type: SysDictType): Promise<SysDictType[]>;

  /**
   * 根据所有字典类型
   *
   * @return 字典类型集合信息
   */
  select_dict_type_all(): Promise<SysDictType[]>;

  /**
   * 根据字典类型ID查询信息
   *
   * @param dict_id 字典类型ID
   * @return 字典类型
   */
  select_dict_type_by_id(dict_id: string): Promise<SysDictType>;

  /**
   * 根据字典类型查询信息
   *
   * @param dict_type 字典类型
   * @return 字典类型
   */
  select_dict_type_by_type(dict_type: string): Promise<SysDictType>;

  /**
   * 通过字典ID删除字典信息
   *
   * @param dict_id 字典ID
   * @return 结果
   */
  delete_dict_type_by_id(dict_id: string): Promise<number>;

  /**
   * 批量删除字典类型信息
   *
   * @param dict_ids 需要删除的字典ID
   * @return 结果
   */
  delete_dict_type_by_ids(dict_ids: string[]): Promise<number>;

  /**
   * 新增字典类型信息
   *
   * @param sys_dict_type 字典类型信息
   * @return 结果
   */
  insert_dict_type(sys_dict_type: SysDictType): Promise<number>;

  /**
   * 修改字典类型信息
   *
   * @param sys_dict_type 字典类型信息
   * @return 结果
   */
  update_dict_type(sys_dict_type: SysDictType): Promise<number>;

  /**
   * 校验字典类型称是否唯一
   *
   * @param dict_type 字典类型
   * @return 结果
   */
  check_unique_dict_type(dict_type: string): Promise<SysDictType>;
}
