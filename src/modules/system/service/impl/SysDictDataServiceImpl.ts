import { Provide, Inject, Singleton } from '@midwayjs/core';
import { SysDictDataRepositoryImpl } from '../../repository/impl/SysDictDataRepositoryImpl';
import { ISysDictDataService } from '../ISysDictDataService';
import { SysDictTypeServiceImpl } from './SysDictTypeServiceImpl';
import { SysDictData } from '../../model/SysDictData';

/**
 * 字典类型数据 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysDictDataServiceImpl implements ISysDictDataService {
  @Inject()
  private sysDictDataRepository: SysDictDataRepositoryImpl;

  @Inject()
  private sysDictTypeService: SysDictTypeServiceImpl;

  async selectDictDataPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysDictDataRepository.selectDictDataPage(query);
  }

  async selectDictDataList(sysDictData: SysDictData): Promise<SysDictData[]> {
    return await this.sysDictDataRepository.selectDictDataList(sysDictData);
  }

  async selectDictDataByCode(dictCode: string): Promise<SysDictData> {
    const dicts = await this.sysDictDataRepository.selectDictDataByCodes([
      dictCode,
    ]);
    if (dicts.length > 0) {
      return dicts[0];
    }
    return null;
  }

  async selectDictDataByType(dictType: string): Promise<SysDictData[]> {
    return await this.sysDictTypeService.getDictCache(dictType);
  }

  async checkUniqueDictLabel(
    dictType: string,
    dictLabel: string,
    dictCode?: string
  ): Promise<boolean> {
    const sysDictData = new SysDictData();
    sysDictData.dictType = dictType;
    sysDictData.dictLabel = dictLabel;
    const uniqueCode = await this.sysDictDataRepository.checkUniqueDictData(
      sysDictData
    );
    if (uniqueCode === dictCode) {
      return true;
    }
    return !uniqueCode;
  }

  async checkUniqueDictValue(
    dictType: string,
    dictValue: string,
    dictCode?: string
  ): Promise<boolean> {
    const sysDictData = new SysDictData();
    sysDictData.dictType = dictType;
    sysDictData.dictValue = dictValue;
    const uniqueCode = await this.sysDictDataRepository.checkUniqueDictData(
      sysDictData
    );
    if (uniqueCode === dictCode) {
      return true;
    }
    return !uniqueCode;
  }

  async insertDictData(sysDictData: SysDictData): Promise<string> {
    const insertId = await this.sysDictDataRepository.insertDictData(
      sysDictData
    );
    if (insertId) {
      // 插入成功后加入缓存
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

  async deleteDictDataByCodes(dictCodes: string[]): Promise<number> {
    // 检查是否存在
    const dictDatas = await this.sysDictDataRepository.selectDictDataByCodes(
      dictCodes
    );
    if (dictDatas.length <= 0) {
      throw new Error('没有权限访问字典编码数据！');
    }
    if (dictDatas.length === dictCodes.length) {
      // 刷新缓存
      for (const v of dictDatas) {
        await this.sysDictTypeService.clearDictCache(v.dictType);
        await this.sysDictTypeService.loadingDictCache(v.dictType);
      }
      const rows = await this.sysDictDataRepository.deleteDictDataByCodes(
        dictCodes
      );
      return rows;
    }
    return 0;
  }
}
