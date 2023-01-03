import { SysDictData } from '../model/SysDictData';

/**
 * 字典类型数据 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysDictDataService {
  /**
   * 根据条件分页查询字典数据
   *
   * @param query 字典数据信息
   * @return 字典数据集合信息
   */
  selectDictDataPage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 根据条件查询字典数据
   *
   * @param sysDictData 字典数据信息
   * @return 字典数据集合信息
   */
  selectDictDataList(sysDictData: SysDictData): Promise<SysDictData[]>;

  /**
   * 根据字典类型和字典键值查询字典数据信息
   *
   * @param dictType 字典类型
   * @param dictValue 字典键值
   * @return 字典标签
   */
  selectDictLabel(dictType: string, dictValue: string): Promise<string>;

  /**
   * 根据字典数据ID查询信息
   *
   * @param dictCode 字典数据ID
   * @return 字典数据
   */
  selectDictDataById(dictCode: string): Promise<SysDictData>;

  /**
   * 校验字典标签是否唯一
   *
   * @param sysDictData 字典数据信息
   * @return 结果
   */
  checkUniqueDictLabel(sysDictData: SysDictData): Promise<boolean>;

  /**
   * 校验字典键值是否唯一
   *
   * @param sysDictData 字典数据信息
   * @return 结果
   */
  checkUniqueDictValue(sysDictData: SysDictData): Promise<boolean>;

  /**
   * 新增保存字典数据信息
   *
   * @param sysDictData 字典数据信息
   * @return 结果
   */
  insertDictData(sysDictData: SysDictData): Promise<string>;

  /**
   * 修改保存字典数据信息
   *
   * @param sysDictData 字典数据信息
   * @return 结果
   */
  updateDictData(sysDictData: SysDictData): Promise<number>;

  /**
   * 批量删除字典数据信息
   *
   * @param dictCodes 需要删除的字典数据ID
   */
  deleteDictDataByIds(dictCodes: string[]): Promise<number>;
}
