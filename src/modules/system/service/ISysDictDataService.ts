import { SysDictData } from '../../../framework/core/model/SysDictData';

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
  selectDictDataPage(query: any): Promise<rowPages>;

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
   * 批量删除字典数据信息
   *
   * @param dictCodes 需要删除的字典数据ID
   */
  deleteDictDataByIds(dictCodes: string[]): Promise<number>;

  /**
   * 新增保存字典数据信息
   *
   * @param sysDictData 字典数据信息
   * @return 结果
   */
  insertDictData(sysDictData: SysDictData): Promise<number>;

  /**
   * 修改保存字典数据信息
   *
   * @param sysDictData 字典数据信息
   * @return 结果
   */
  updateDictData(sysDictData: SysDictData): Promise<number>;
}
