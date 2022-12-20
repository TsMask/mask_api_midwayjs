import { Provide, Inject } from '@midwayjs/decorator';
import { SysDictData } from '../../../../framework/core/model/SysDictData';
import { SysDictDataRepositoryImpl } from '../../repository/impl/SysDictDataRepositoryImpl';
import { ISysDictDataService } from '../ISysDictDataService';
import { SysDictTypeServiceImpl } from './SysDictTypeServiceImpl';

/**
 * 字典类型数据 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysDictDataServiceImpl implements ISysDictDataService {
  @Inject()
  private sysDictDataRepository: SysDictDataRepositoryImpl;

  @Inject()
  private sysDictTypeService: SysDictTypeServiceImpl;

  async selectDictDataPage(query: any): Promise<rowPages> {
    return await this.sysDictDataRepository.selectDictDataPage(query);
  }

  async selectDictDataList(sysDictData: SysDictData): Promise<SysDictData[]> {
    return await this.sysDictDataRepository.selectDictDataList(sysDictData);
  }

  async selectDictLabel(dictType: string, dictValue: string): Promise<string> {
    return await this.sysDictDataRepository.selectDictLabel(
      dictType,
      dictValue
    );
  }

  async selectDictDataById(dictCode: string): Promise<SysDictData> {
    return await this.sysDictDataRepository.selectDictDataById(dictCode);
  }

  async checkUniqueDictLabel(sysDictData: SysDictData): Promise<boolean> {
    const dictCode = await this.sysDictDataRepository.checkUniqueDictLabel(
      sysDictData.dictType,
      sysDictData.dictLabel
    );
    // 字典数据与查询得到字典数据code一致
    if (dictCode && sysDictData.dictCode === dictCode) {
      return true;
    }
    return !dictCode;
  }

  async checkUniqueDictValue(sysDictData: SysDictData): Promise<boolean> {
    const dictCode = await this.sysDictDataRepository.checkUniqueDictValue(
      sysDictData.dictType,
      sysDictData.dictValue
    );
    // 字典数据与查询得到字典数据code一致
    if (dictCode && sysDictData.dictCode === dictCode) {
      return true;
    }
    return !dictCode;
  }

  async insertDictData(sysDictData: SysDictData): Promise<string> {
    const insertId = await this.sysDictDataRepository.insertDictData(
      sysDictData
    );
    if (insertId) {
      await this.sysDictTypeService.loadingDictCache(sysDictData.dictType);
    }
    return insertId;
  }

  async updateDictData(sysDictData: SysDictData): Promise<number> {
    const rows = await this.sysDictDataRepository.updateDictData(sysDictData);
    if (rows > 0) {
      await this.sysDictTypeService.loadingDictCache(sysDictData.dictType);
    }
    return rows;
  }

  async deleteDictDataByIds(dictCodes: string[]): Promise<number> {
    let dictTypes: string[] = [];
    for (const dictCode of dictCodes) {
      // 检查是否存在
      const dictData = await this.sysDictDataRepository.selectDictDataById(
        dictCode
      );
      if (!dictData) {
        throw new Error('没有权限访问字典数据数据！');
      }
      dictTypes.push(dictData.dictType);
    }
    dictTypes = [...new Set(dictTypes)];
    const rows = await this.sysDictDataRepository.deleteDictDataByIds(
      dictCodes
    );
    if (rows > 0) {
      // 刷新缓存
      for (const dictType of dictTypes) {
        await this.sysDictTypeService.clearDictCache(dictType);
        await this.sysDictTypeService.loadingDictCache(dictType);
      }
    }
    return rows;
  }
}