import { Provide, Inject, Init, Singleton } from '@midwayjs/core';
import { SYS_DICT_KEY } from '../../../../framework/constants/CacheKeysConstants';
import { RedisCache } from '../../../../framework/cache/RedisCache';
import { STATUS_YES } from '../../../../framework/constants/CommonConstants';
import { SysDictDataRepositoryImpl } from '../../repository/impl/SysDictDataRepositoryImpl';
import { SysDictTypeRepositoryImpl } from '../../repository/impl/SysDictTypeRepositoryImpl';
import { ISysDictTypeService } from '../ISysDictTypeService';
import { SysDictData } from '../../model/SysDictData';
import { SysDictType } from '../../model/SysDictType';

/**
 * 字典类型 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysDictTypeServiceImpl implements ISysDictTypeService {
  @Inject()
  private sysDictDataRepository: SysDictDataRepositoryImpl;

  @Inject()
  private sysDictTypeRepository: SysDictTypeRepositoryImpl;

  @Inject()
  private redisCache: RedisCache;

  @Init()
  async init() {
    // 启动时，刷新缓存-字典类型数据
    await this.resetDictCache();
  }

  async selectDictTypePage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysDictTypeRepository.selectDictTypePage(query);
  }

  async selectDictTypeList(sysDictType: SysDictType): Promise<SysDictType[]> {
    return await this.sysDictTypeRepository.selectDictTypeList(sysDictType);
  }

  async selectDictTypeById(dictId: string): Promise<SysDictType> {
    const dicts = await this.sysDictTypeRepository.selectDictTypeByIds([
      dictId,
    ]);
    if (dicts.length > 0) {
      return dicts[0];
    }
    return null;
  }

  async selectDictTypeByType(dictType: string): Promise<SysDictType> {
    return await this.sysDictTypeRepository.selectDictTypeByType(dictType);
  }

  async checkUniqueDictName(dictName: string, dictId = ''): Promise<boolean> {
    const sysDictType = new SysDictType();
    sysDictType.dictName = dictName;
    const uniqueId = await this.sysDictTypeRepository.checkUniqueDictType(
      sysDictType
    );
    if (uniqueId === dictId) {
      return true;
    }
    return !uniqueId;
  }

  async checkUniqueDictType(dictType: string, dictId = ''): Promise<boolean> {
    const sysDictType = new SysDictType();
    sysDictType.dictType = dictType;
    const uniqueId = await this.sysDictTypeRepository.checkUniqueDictType(
      sysDictType
    );
    if (uniqueId === dictId) {
      return true;
    }
    return !uniqueId;
  }

  async insertDictType(sysDictType: SysDictType): Promise<string> {
    const insertId = await this.sysDictTypeRepository.insertDictType(
      sysDictType
    );
    if (insertId) {
      await this.loadingDictCache(sysDictType.dictType);
    }
    return insertId;
  }

  async updateDictType(sysDictType: SysDictType): Promise<number> {
    const dict = await this.selectDictTypeById(sysDictType.dictId);
    if (!dict) return 0;
    const rows = await this.sysDictTypeRepository.updateDictType(sysDictType);
    // 修改字典类型key时同步更新其字典数据的类型key
    if (rows > 0 && dict.dictType !== sysDictType.dictType) {
      await this.sysDictDataRepository.updateDictDataType(
        dict.dictType,
        sysDictType.dictType
      );
    }
    // 刷新缓存
    await this.clearDictCache(dict.dictType);
    await this.loadingDictCache(sysDictType.dictType);
    return rows;
  }

  async deleteDictTypeByIds(dictIds: string[]): Promise<number> {
    const dicts = await this.sysDictTypeRepository.selectDictTypeByIds(dictIds);
    if (dicts.length <= 0) {
      throw new Error('没有权限访问字典类型数据！');
    }
    for (const dict of dicts) {
      const useCount = await this.sysDictDataRepository.countDictDataByType(
        dict.dictType
      );
      if (useCount > 0) {
        throw new Error(`【${dict.dictName}】存在字典数据,不能删除`);
      }
      // 清除缓存
      await this.clearDictCache(dict.dictType);
    }
    if (dicts.length === dictIds.length) {
      return await this.sysDictTypeRepository.deleteDictTypeByIds(dictIds);
    }
    return 0;
  }

  async resetDictCache(): Promise<void> {
    await this.clearDictCache('*');
    await this.loadingDictCache();
  }

  /**
   * 设置cache key
   * @param dictType 字典类型
   * @return 缓存键key
   */
  private cacheKey(dictType: string): string {
    return SYS_DICT_KEY + dictType;
  }

  async loadingDictCache(dictType?: string): Promise<void> {
    const sysDictData = new SysDictData();
    sysDictData.status = STATUS_YES;
    // 指定字典类型
    if (dictType) {
      sysDictData.dictType = dictType;
      // 删除缓存
      await this.redisCache.del(SYS_DICT_KEY + dictType);
    }
    const sysDictDataList = await this.sysDictDataRepository.selectDictDataList(
      sysDictData
    );
    // 查询字典数据为0时不初始字典类型缓存
    if (sysDictDataList && sysDictDataList.length <= 0) return;
    // 将字典数据根据类型遍历分组
    const map = new Map<string, SysDictData[]>();
    for (const dict of sysDictDataList) {
      const key = dict.dictType;
      const item = map.get(key);
      if (item && item.length > 0) {
        item.push(dict);
        map.set(key, item);
      } else {
        map.set(key, [dict]);
      }
    }
    // 放入缓存
    map.forEach((values, key) => {
      this.redisCache.set(this.cacheKey(key), JSON.stringify(values));
    });
  }

  async clearDictCache(dictType: string): Promise<number> {
    const key = this.cacheKey(dictType);
    const keys = await this.redisCache.getKeys(key);
    return await this.redisCache.delKeys(keys);
  }

  async getDictCache(dictType: string): Promise<SysDictData[]> {
    const key = this.cacheKey(dictType);
    let data: SysDictData[] = [];
    const str = await this.redisCache.get(key);
    if (str && str.length > 7) {
      // 反序列化得到数组数据
      data = JSON.parse(str);
    } else {
      // 查询类型字典数据放入缓存
      const sysDictData = new SysDictData();
      sysDictData.status = STATUS_YES;
      sysDictData.dictType = dictType;
      data = await this.sysDictDataRepository.selectDictDataList(sysDictData);
      if (data && data.length > 0) {
        await this.redisCache.del(key);
        await this.redisCache.set(key, JSON.stringify(data));
      }
    }
    return data;
  }
}
