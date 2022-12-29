import { Provide, Inject, Init, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SYS_DICT_KEY } from '../../../../framework/constants/CacheKeysConstants';
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
    return await this.sysDictTypeRepository.selectDictTypeById(dictId);
  }

  async selectDictTypeByType(dictType: string): Promise<SysDictType> {
    return await this.sysDictTypeRepository.selectDictTypeByType(dictType);
  }

  async checkUniqueDictName(sysDictType: SysDictType): Promise<boolean> {
    const dictId = await this.sysDictTypeRepository.checkUniqueDictName(
      sysDictType.dictName
    );
    // 字典类型与查询得到字典类型ID一致
    if (dictId && sysDictType.dictId === dictId) {
      return true;
    }
    return !dictId;
  }

  async checkUniqueDictType(sysDictType: SysDictType): Promise<boolean> {
    const dictId = await this.sysDictTypeRepository.checkUniqueDictType(
      sysDictType.dictType
    );
    // 字典类型与查询得到字典类型ID一致
    if (dictId && sysDictType.dictId === dictId) {
      return true;
    }
    return !dictId;
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
      await this.clearDictCache(dict.dictType);
      await this.loadingDictCache(sysDictType.dictType);
    }
    return rows;
  }

  async deleteDictTypeByIds(dictIds: string[]): Promise<number> {
    for (const dictId of dictIds) {
      // 检查是否存在
      const dict = await this.sysDictTypeRepository.selectDictTypeById(dictId);
      if (!dict) {
        throw new Error('没有权限访问字典类型数据！');
      }
      const useCount = await this.sysDictDataRepository.countDictDataByType(
        dict.dictType
      );
      if (useCount > 0) {
        throw new Error(`【${dict.dictName}】存在字典数据,不能删除`);
      }
      // 清除缓存
      await this.clearDictCache(dict.dictType);
    }
    return await this.sysDictTypeRepository.deleteDictTypeByIds(dictIds);
  }

  async loadingDictCache(dictType?: string): Promise<void> {
    const sysDictData = new SysDictData();
    sysDictData.status = '0';
    // 指定字典类型
    if (dictType) {
      sysDictData.dictType = dictType;
      await this.redisCache.del(SYS_DICT_KEY + dictType);
    }
    const dictDatas = await this.sysDictDataRepository.selectDictDataList(
      sysDictData
    );
    // 查询字典数据为0时不初始字典类型缓存
    if (dictDatas.length <= 0) return;
    // 将字典数据根据类型遍历分组
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

  async clearDictCache(dictType = '*'): Promise<number> {
    const key = SYS_DICT_KEY + dictType;
    const keys = await this.redisCache.getKeys(key);
    return await this.redisCache.delKeys(keys);
  }

  async resetDictCache(): Promise<void> {
    await this.clearDictCache();
    await this.loadingDictCache();
  }
}
