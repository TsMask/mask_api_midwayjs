import { SysDictType } from '../../../framework/core/model/SysDictType';

/**
 * 字典类型 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysDictTypeService {
  /**
   * 根据条件分页查询字典类型
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
   * 批量删除字典信息
   *
   * @param dictIds 需要删除的字典ID
   */
  deleteDictTypeByIds(dictIds: string[]): Promise<number>;

  /**
   * 加载字典缓存数据
   * @param dictType 字典类型，不指定即加载所有
   */
  loadingDictCache(dictType?:string): Promise<void>;

  /**
   * 清空字典缓存数据
   */
  clearDictCache(): Promise<number>;

  /**
   * 重置字典缓存数据
   */
  resetDictCache(): Promise<void>;

  /**
   * 新增保存字典类型信息
   *
   * @param sysDictType 字典类型信息
   * @return 结果
   */
  insertDictType(sysDictType: SysDictType): Promise<number>;

  /**
   * 修改保存字典类型信息
   *
   * @param sysDictType 字典类型信息
   * @return 结果
   */
  updateDictType(sysDictType: SysDictType): Promise<number>;
}
