import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { SysDictData } from '../../model/SysDictData';
import { SysDictDataRepositoryImpl } from '../../repository/impl/SysDictDataRepositoryImpl';
import { ISysDictDataService } from '../ISysDictDataService';
import { SysDictTypeServiceImpl } from './SysDictTypeServiceImpl';

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

  async selectDictLabel(dictType: string, dictValue: string): Promise<string> {
    return await this.sysDictDataRepository.selectDictLabel(
      dictType,
      dictValue
    );
  }

  async selectDictDataByCode(dictCode: string): Promise<SysDictData> {
    return await this.sysDictDataRepository.selectDictDataByCode(dictCode);
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
    let dictTypes: string[] = [];
    for (const dictCode of dictCodes) {
      // 检查是否存在
      const dictData = await this.sysDictDataRepository.selectDictDataByCode(
        dictCode
      );
      if (!dictData) {
        throw new Error('没有权限访问字典编码数据！');
      }
      dictTypes.push(dictData.dictType);
    }
    dictTypes = [...new Set(dictTypes)];
    const rows = await this.sysDictDataRepository.deleteDictDataByCodes(
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
