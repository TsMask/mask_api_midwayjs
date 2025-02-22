import { Provide, Inject, Singleton } from '@midwayjs/core';

import { FileUtil } from '../../../framework/utils/file/file';
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
   * @param dictType 字典类型
   * @returns []
   */
  public async findByType(dictType: string): Promise<SysDictData[]> {
    return await this.sysDictTypeService.findDataByType(dictType);
  }

  /**
   * 新增信息
   * @param sysDictData 信息
   * @returns ID
   */
  public async insert(sysDictData: SysDictData): Promise<number> {
    const insertId = await this.sysDictDataRepository.insert(sysDictData);
    if (insertId > 0) {
      await this.sysDictTypeService.cacheLoad(sysDictData.dictType);
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
      await this.sysDictTypeService.cacheLoad(sysDictData.dictType);
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
        await this.sysDictTypeService.cacheClean(v.dictType);
        await this.sysDictTypeService.cacheLoad(v.dictType);
      }
      const rows = await this.sysDictDataRepository.deleteByIds(dictIds);
      return [rows, ''];
    }
    return [0, '删除字典数据信息失败！'];
  }

  /**
   * 检查同字典类型下字典标签是否唯一
   * @param dictType 字典类型
   * @param dataLabel 数据标签
   * @param dataId 数据ID
   * @returns 结果
   */
  public async checkUniqueTypeByLabel(
    dictType: string,
    dataLabel: string,
    dataId: number
  ): Promise<boolean> {
    const sysDictData = new SysDictData();
    sysDictData.dictType = dictType;
    sysDictData.dataLabel = dataLabel;
    const uniqueId = await this.sysDictDataRepository.checkUnique(sysDictData);
    if (uniqueId === dataId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查同字典类型下字典键值是否唯一
   * @param dictType 字典类型
   * @param dataValue 数据键值
   * @param dataId 数据ID
   * @returns 结果
   */
  public async checkUniqueTypeByValue(
    dictType: string,
    dataValue: string,
    dataId: number
  ): Promise<boolean> {
    const sysDictData = new SysDictData();
    sysDictData.dictType = dictType;
    sysDictData.dataValue = dataValue;
    const uniqueId = await this.sysDictDataRepository.checkUnique(sysDictData);
    if (uniqueId === dataId) {
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
    // 导出数据组装
    const dataCells: Record<string, any>[] = [];
    for (const row of rows) {
      let statusValue = '停用';
      if (row.statusFlag === '1') {
        statusValue = '正常';
      }
      const data = {
        字典类型: row.dictType,
        数据排序: row.dataSort,
        数据编号: row.dataId,
        数据标签: row.dataLabel,
        数据键值: row.dataValue,
        数据状态: statusValue,
      };
      dataCells.push(data);
    }
    return await this.fileUtil.excelWriteRecord(dataCells, fileName);
  }
}
