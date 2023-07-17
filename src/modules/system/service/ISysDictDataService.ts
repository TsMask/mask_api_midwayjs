import { SysDictData } from '../model/SysDictData';

/**
 * 字典类型数据 服务层接口
 *
 * @author TsMask
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
   * 根据字典数据编码查询信息
   *
   * @param dictCode 字典数据编码
   * @return 字典数据
   */
  selectDictDataByCode(dictCode: string): Promise<SysDictData>;

  /**
   * 根据字典类型查询信息
   *
   * @param dictType 字典数据类型
   * @return 字典数据
   */
  selectDictDataByType(dictType: string): Promise<SysDictData[]>;

  /**
   * 校验字典标签是否唯一
   *
   * @param dictType 字典数据类型
   * @param dictLabel 字典标签
   * @param dictCode 字典数据编码，更新时传入
   * @return 结果
   */
  checkUniqueDictLabel(
    dictType: string,
    dictLabel: string,
    dictCode: string
  ): Promise<boolean>;

  /**
   * 校验字典键值是否唯一
   *
   * @param dictType 字典数据类型
   * @param dictValue 字典键值
   * @param dictCode 字典数据编码，更新时传入
   * @return 结果
   */
  checkUniqueDictValue(
    dictType: string,
    dictValue: string,
    dictCode: string
  ): Promise<boolean>;

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
  deleteDictDataByCodes(dictCodes: string[]): Promise<number>;
}
