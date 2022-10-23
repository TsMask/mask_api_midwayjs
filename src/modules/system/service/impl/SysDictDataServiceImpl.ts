import { Provide, Inject } from '@midwayjs/decorator';
import { SysDictData } from '../../../../framework/core/model/SysDictData';
import { SysDictDataRepositoryImpl } from '../../repository/impl/SysDictDataRepositoryImpl';
import { ISysDictDataService } from '../ISysDictDataService';

/**
 * 用户 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysDictDataServiceImpl implements ISysDictDataService {
  @Inject()
  private sysDictDataRepository: SysDictDataRepositoryImpl;

  async selectDictDataList(sysDictData: SysDictData): Promise<SysDictData[]> {
    return await this.selectDictDataList(sysDictData);
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

  deleteDictDataByIds(dictCodes: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  insertDictData(sysDictData: SysDictData): Promise<number> {
    throw new Error('Method not implemented.');
  }
  updateDictData(sysDictData: SysDictData): Promise<number> {
    throw new Error('Method not implemented.');
  }
}
