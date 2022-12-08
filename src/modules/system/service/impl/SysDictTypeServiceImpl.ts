import { Provide, Inject, Init, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SYS_DICT_KEY } from '../../../../common/constants/CacheKeysConstants';
import { SysDictData } from '../../../../framework/core/model/SysDictData';
import { SysDictType } from '../../../../framework/core/model/SysDictType';
import { RedisCache } from '../../../../framework/redis/RedisCache';
import { SysDictDataRepositoryImpl } from '../../repository/impl/SysDictDataRepositoryImpl';
import { SysDictTypeRepositoryImpl } from '../../repository/impl/SysDictTypeRepositoryImpl';
import { ISysDictTypeService } from '../ISysDictTypeService';

/**
 * 字典类型 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysDictTypeServiceImpl implements ISysDictTypeService {
  @Inject()
  private sysDictDataRepository: SysDictDataRepositoryImpl;
  @Inject()
  private sysDictTypeRepository: SysDictTypeRepositoryImpl;
  @Inject()
  private redisCache: RedisCache;

  /**
   * 启动时，初始化参数到缓存
   */
  @Init()
  async init() {
    await this.loadingDictCache();
  }

  async selectDictTypePage(query: any): Promise<rowPages> {
    return await this.sysDictTypeRepository.selectDictTypePage(query);
  }

  async selectDictTypeList(sysDictType: SysDictType): Promise<SysDictType[]> {
    return await this.sysDictTypeRepository.selectDictTypeList(sysDictType);
  }
  async selectDictTypeByType(dictType: string): Promise<SysDictType> {
    return await this.sysDictTypeRepository.selectDictTypeByType(dictType);
  }
  async selectDictTypeById(dictId: string): Promise<SysDictType> {
    return await this.sysDictTypeRepository.selectDictTypeById(dictId);
  }
  async deleteDictTypeByIds(dictIds: string[]): Promise<number> {
    return await this.sysDictTypeRepository.deleteDictTypeByIds(dictIds);
  }

  async loadingDictCache(dictType?: string): Promise<void> {
    const sysDictData = new SysDictData();
    sysDictData.status = '0';
    if (dictType) {
      sysDictData.dictType = dictType;
      await this.redisCache.del(SYS_DICT_KEY + dictType);
    }
    const dictDatas = await this.sysDictDataRepository.selectDictDataList(
      sysDictData
    );
    // 遍历分组
    const dictDatasObj = dictDatas.reduce((pre, cur) => {
      const key = cur.dictType;
      if (!Object.prototype.hasOwnProperty.call(pre, key)) {
        pre[key] = [];
      }
      pre[key].push(cur);
      return pre;
    }, {});
    // 把组数据进行缓存
    for (const key in dictDatasObj) {
      if (Object.prototype.hasOwnProperty.call(dictDatasObj, key)) {
        const element = dictDatasObj[key];
        await this.redisCache.set(SYS_DICT_KEY + key, JSON.stringify(element));
      }
    }
  }
  async clearDictCache(): Promise<number> {
    const key = SYS_DICT_KEY + '*';
    const keysArr = await this.redisCache.getKeys(key);
    return await this.redisCache.delKeys(keysArr);
  }
  async resetDictCache(): Promise<void> {
    await this.clearDictCache();
    await this.loadingDictCache();
  }

  async insertDictType(sysDictType: SysDictType): Promise<number> {
    const row = await this.sysDictTypeRepository.insertDictType(sysDictType);
    if (row > 0) {
      await this.loadingDictCache(sysDictType.dictType);
    }
    return row;
  }

  async updateDictType(sysDictType: SysDictType): Promise<number> {
    const oldDict = await this.selectDictTypeById(sysDictType.dictId);
    if (!oldDict) return 0;
    await this.sysDictDataRepository.updateDictDataType(
      oldDict.dictType,
      sysDictType.dictType
    );
    const row = await this.sysDictTypeRepository.updateDictType(sysDictType);
    if (row > 0) {
      await this.loadingDictCache(sysDictType.dictType);
    }
    return row;
  }
}
