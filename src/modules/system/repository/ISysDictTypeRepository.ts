import { SysDictType } from '../../../framework/core/model/SysDictType';

/**
 * 字典类型表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysDictTypeRepository {
  /**
   * 根据条件分页查询字典类型
   *
   * @param query 字典类型查询数据信息
   * @return 字典数据集合信息
   */
  selectDictTypePage(query: any): Promise<rowPages>;

  /**
   * 根据条件查询字典类型
   *
   * @param sysDictType 字典类型信息
   * @return 字典类型集合信息
   */
  selectDictTypeList(sysDictType: SysDictType): Promise<SysDictType[]>;

  /**
   * 根据字典类型ID查询信息
   *
   * @param dictId 字典类型ID
   * @return 字典类型
   */
  selectDictTypeById(dictId: string): Promise<SysDictType>;

  /**
   * 根据字典类型查询信息
   *
   * @param dictType 字典类型
   * @return 字典类型
   */
  selectDictTypeByType(dictType: string): Promise<SysDictType>;

  /**
   * 通过字典ID删除字典信息
   *
   * @param dictId 字典ID
   * @return 结果
   */
  deleteDictTypeById(dictId: string): Promise<number>;

  /**
   * 批量删除字典类型信息
   *
   * @param dictIds 需要删除的字典ID
   * @return 结果
   */
  deleteDictTypeByIds(dictIds: string[]): Promise<number>;

  /**
   * 新增字典类型信息
   *
   * @param sysDictType 字典类型信息
   * @return 结果
   */
  insertDictType(sysDictType: SysDictType): Promise<string>;

  /**
   * 修改字典类型信息
   *
   * @param sysDictType 字典类型信息
   * @return 结果
   */
  updateDictType(sysDictType: SysDictType): Promise<number>;
}
