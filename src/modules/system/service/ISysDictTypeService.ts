import { SysDictData } from '../model/SysDictData';
import { SysDictType } from '../model/SysDictType';

/**
 * 字典类型 服务层接口
 *
 * @author TsMask
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
   * 校验字典名称是否唯一
   *
   * @param dictName 字典名称
   * @param dictId 字典类型ID，更新时传入
   * @return 结果
   */
  checkUniqueDictName(dictName: string, dictId: string): Promise<boolean>;

  /**
   * 校验字典类型是否唯一
   *
   * @param dictType 字典类型
   * @param dictId 字典类型ID，更新时传入
   * @return 结果
   */
  checkUniqueDictType(dictType: string, dictId: string): Promise<boolean>;

  /**
   * 新增保存字典类型信息
   *
   * @param sysDictType 字典类型信息
   * @return 结果
   */
  insertDictType(sysDictType: SysDictType): Promise<string>;

  /**
   * 修改保存字典类型信息
   *
   * @param sysDictType 字典类型信息
   * @return 结果
   */
  updateDictType(sysDictType: SysDictType): Promise<number>;

  /**
   * 批量删除字典信息
   *
   * @param dictIds 需要删除的字典ID
   */
  deleteDictTypeByIds(dictIds: string[]): Promise<number>;

  /**
   * 获取字典缓存数据
   * @param dictType 字典类型
   */
  getDictCache(dictType: string): Promise<SysDictData[]>;

  /**
   * 加载字典缓存数据
   * @param dictType 字典类型，不指定即加载所有
   */
  loadingDictCache(dictType?: string): Promise<void>;

  /**
   * 清空字典缓存数据
   * @param dictType 字典类型，不指定即清除所有
   */
  clearDictCache(dictType?: string): Promise<number>;

  /**
   * 重置字典缓存数据
   */
  resetDictCache(): Promise<void>;
}
