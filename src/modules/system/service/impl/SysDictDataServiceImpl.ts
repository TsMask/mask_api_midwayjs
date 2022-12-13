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

  async deleteDictDataByIds(dictCodes: string[]): Promise<number> {
    return await this.sysDictDataRepository.deleteDictDataByIds(dictCodes);
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
    const row = await this.sysDictDataRepository.updateDictData(sysDictData);
    if (row > 0) {
      await this.sysDictTypeService.loadingDictCache(sysDictData.dictType);
    }
    return row;
  }
}
