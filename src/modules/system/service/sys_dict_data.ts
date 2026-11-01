import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../internal/shared/file/file';
import { SysDictDataRepository } from '../repository/sys_dict_data';
import { SysDictTypeService } from './sys_dict_type';
import { SysDictData } from '../model/sys_dict_data';

/**字典类型数据 服务层处理 */
@Provide()
@Singleton()
export class SysDictDataService {
  /**字典数据服务 */
  @Inject()
  private sysDictDataRepository: SysDictDataRepository;

  /**字典类型服务 */
  @Inject()
  private sysDictTypeService: SysDictTypeService;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @returns []
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysDictData[], number]> {
    return await this.sysDictDataRepository.selectByPage(query);
  }

  /**
   * 新增信息
   * @param sysDictData 信息
   * @returns 信息数组
   */
  public async find(sysDictData: SysDictData): Promise<SysDictData[]> {
    return await this.sysDictDataRepository.select(sysDictData);
  }

  /**
   * 通过ID查询信息
   * @param dictId ID
   * @returns 结果
   */
  public async findById(dictId: number): Promise<SysDictData> {
    if (dictId < 0) {
      return new SysDictData();
    }
    const dicts = await this.sysDictDataRepository.selectByIds([dictId]);
    if (dicts.length > 0) {
      return dicts[0];
    }
    return new SysDictData();
  }

  /**
   * 根据字典类型查询信息
   * @param dict_type 字典类型
   * @returns []
   */
  public async findByType(dict_type: string): Promise<SysDictData[]> {
    return await this.sysDictTypeService.findDataByType(dict_type);
  }

  /**
   * 新增信息
   * @param sysDictData 信息
   * @returns ID
   */
  public async insert(sysDictData: SysDictData): Promise<number> {
    const insertId = await this.sysDictDataRepository.insert(sysDictData);
    if (insertId > 0) {
      await this.sysDictTypeService.cacheLoad(sysDictData.dict_type);
    }
    return insertId;
  }

  /**
   * 修改信息
   * @param sysDictData 信息
   * @returns 影响记录数
   */
  public async update(sysDictData: SysDictData): Promise<number> {
    const rows = await this.sysDictDataRepository.update(sysDictData);
    if (rows > 0) {
      await this.sysDictTypeService.cacheLoad(sysDictData.dict_type);
    }
    return rows;
  }

  /**
   * 批量删除信息
   * @param dictIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(dictIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const dicts = await this.sysDictDataRepository.selectByIds(dictIds);
    if (dicts.length <= 0) {
      return [0, '没有权限访问字典编码数据！'];
    }
    if (dicts.length === dictIds.length) {
      for (const v of dicts) {
        // 刷新缓存
        await this.sysDictTypeService.cacheClean(v.dict_type);
        await this.sysDictTypeService.cacheLoad(v.dict_type);
      }
      const rows = await this.sysDictDataRepository.deleteByIds(dictIds);
      return [rows, ''];
    }
    return [0, '删除字典数据信息失败！'];
  }

  /**
   * 检查同字典类型下字典标签是否唯一
   * @param dict_type 字典类型
   * @param data_label 数据标签
   * @param dataId 数据ID
   * @returns 结果
   */
  public async checkUniqueTypeByLabel(
    dict_type: string,
    data_label: string,
    dataId: number
  ): Promise<boolean> {
    const sysDictData = new SysDictData();
    sysDictData.dict_type = dict_type;
    sysDictData.data_label = data_label;
    const uniqueId = await this.sysDictDataRepository.checkUnique(sysDictData);
    if (uniqueId === dataId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查同字典类型下字典键值是否唯一
   * @param dict_type 字典类型
   * @param data_value 数据键值
   * @param dataId 数据ID
   * @returns 结果
   */
  public async checkUniqueTypeByValue(
    dict_type: string,
    data_value: string,
    id: number
  ): Promise<boolean> {
    const sysDictData = new SysDictData();
    sysDictData.dict_type = dict_type;
    sysDictData.data_value = data_value;
    const uniqueId = await this.sysDictDataRepository.checkUnique(sysDictData);
    if (uniqueId === id) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysDictData[], fileName: string) {
    // 第一行表头标题
    const data: string[][] = [
      ['字典类型', '数据排序', '数据编号', '数据标签', '数据键值', '数据状态'],
    ];
    for (const row of rows) {
      let statusValue = '停用';
      if (row.data_status === '1') {
        statusValue = '正常';
      }
      data.push([
        row.dict_type ?? '',
        `${row.data_sort ?? 0}`,
        `${row.id ?? 0}`,
        row.data_label ?? '',
        row.data_value ?? '',
        statusValue,
      ]);
    }
    return await this.fileUtil.csvWriteRecord(data, fileName);
  }
}
