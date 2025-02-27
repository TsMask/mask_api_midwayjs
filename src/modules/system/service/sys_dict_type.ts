import { Provide, Inject, Init, Singleton } from '@midwayjs/core';

import { STATUS_YES } from '../../../framework/constants/common';
import { CACHE_SYS_DICT } from '../../../framework/constants/cache_key';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { FileUtil } from '../../../framework/utils/file/file';
import { SysDictTypeRepository } from '../repository/sys_dict_type';
import { SysDictDataRepository } from '../repository/sys_dict_data';
import { SysDictData } from '../model/sys_dict_data';
import { SysDictType } from '../model/sys_dict_type';

/**字典类型 服务层处理 */
@Provide()
@Singleton()
export class SysDictTypeService {
  /**字典类型服务 */
  @Inject()
  private sysDictTypeRepository: SysDictTypeRepository;

  /**字典数据服务 */
  @Inject()
  private sysDictDataRepository: SysDictDataRepository;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**缓存服务 */
  @Inject()
  private redisCache: RedisCache;

  /**初始化 */
  @Init()
  public async init() {
    // 启动时，刷新缓存-字典类型数据
    await this.cacheClean('*');
    await this.cacheLoad('*');
  }

  /**
   * 分页查询列表数据
   * @param query 参数
   * @returns []
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysDictType[], number]> {
    return await this.sysDictTypeRepository.selectByPage(query);
  }

  /**
   * 查询数据
   * @param sysDictType 信息
   * @returns []
   */
  public async find(sysDictType: SysDictType): Promise<SysDictType[]> {
    return await this.sysDictTypeRepository.select(sysDictType);
  }

  /**
   * 通过ID查询信息
   * @param dictId ID
   * @returns 结果
   */
  public async findById(dictId: number): Promise<SysDictType> {
    if (dictId < 0) {
      return new SysDictType();
    }
    const dictTypes = await this.sysDictTypeRepository.selectByIds([dictId]);
    if (dictTypes.length > 0) {
      return dictTypes[0];
    }
    return new SysDictType();
  }

  /**
   * 根据字典类型查询信息
   * @param dictType 字典类型
   * @returns 结果
   */
  public async findByType(dictType: string): Promise<SysDictType> {
    return await this.sysDictTypeRepository.selectByType(dictType);
  }

  /**
   * 新增信息
   * @param sysDictType 信息
   * @returns ID
   */
  public async insert(sysDictType: SysDictType): Promise<number> {
    const insertId = await this.sysDictTypeRepository.insert(sysDictType);
    if (insertId > 0) {
      await this.cacheLoad(sysDictType.dictType);
    }
    return insertId;
  }

  /**
   * 修改信息
   * @param sysDictType 信息
   * @returns 影响记录数
   */
  public async update(sysDictType: SysDictType): Promise<number> {
    const arr = await this.sysDictTypeRepository.selectByIds([
      sysDictType.dictId,
    ]);
    if (arr.length === 0) {
      return 0;
    }
    // 同字典类型被修改时，同步更新修改
    const oldDictType = arr[0].dictType;
    const rows = await this.sysDictTypeRepository.update(sysDictType);
    if (
      rows > 0 &&
      oldDictType !== '' &&
      oldDictType !== sysDictType.dictType
    ) {
      this.sysDictDataRepository.updateDataByDictType(
        oldDictType,
        sysDictType.dictType
      );
    }
    // 刷新缓存
    this.cacheLoad(sysDictType.dictType);
    return rows;
  }

  /**
   * 批量删除信息
   * @param dictIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(dictIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const arr = await this.sysDictTypeRepository.selectByIds(dictIds);
    if (arr.length <= 0) {
      return [0, '没有权限访问字典类型数据！'];
    }
    for (const v of arr) {
      // 字典类型下级含有数据
      const useCount = await this.sysDictDataRepository.existDataByDictType(
        v.dictType
      );
      if (useCount > 0) {
        return [0, `【${v.dictName}】存在字典数据,不能删除`];
      }
      // 清除缓存
      this.cacheClean(v.dictType);
    }
    if (arr.length === dictIds.length) {
      const rows = await this.sysDictTypeRepository.deleteByIds(dictIds);
      return [rows, ''];
    }
    return [0, '删除字典数据信息失败！'];
  }

  /**
   * 检查字典名称是否唯一
   * @param dictName 字典名称
   * @param dictId 字典ID
   * @returns 结果
   */
  public async checkUniqueByName(
    dictName: string,
    dictId: number
  ): Promise<boolean> {
    const sysDictType = new SysDictType();
    sysDictType.dictName = dictName;
    const uniqueId = await this.sysDictTypeRepository.checkUnique(sysDictType);
    if (uniqueId === dictId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查字典类型是否唯一
   * @param dictType 字典类型
   * @param dictId 字典ID
   * @returns 结果
   */
  public async checkUniqueByType(
    dictType: string,
    dictId: number
  ): Promise<boolean> {
    const sysDictType = new SysDictType();
    sysDictType.dictType = dictType;
    const uniqueId = await this.sysDictTypeRepository.checkUnique(sysDictType);
    if (uniqueId === dictId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 获取字典数据缓存数据
   * @param dictType 字典类型
   * @returns 结果
   */
  public async findDataByType(dictType: string): Promise<SysDictData[]> {
    let data: SysDictData[] = [];
    const key = CACHE_SYS_DICT + ':' + dictType;
    const jsonStr = await this.redisCache.get('', key);
    if (jsonStr.length > 7) {
      data = JSON.parse(jsonStr);
    } else {
      const sysDictData = new SysDictData();
      sysDictData.statusFlag = STATUS_YES;
      sysDictData.dictType = dictType;
      data = await this.sysDictDataRepository.select(sysDictData);
      if (data.length > 0) {
        await this.redisCache.del('', key);
        await this.redisCache.set('', key, JSON.stringify(data));
      }
    }
    return data;
  }

  /**
   * 加载字典缓存数据
   * @param dictType 字典类型 传入*查询全部
   * @returns 结果
   */
  public async cacheLoad(dictType: string): Promise<void> {
    const sysDictData = new SysDictData();
    sysDictData.dictType = dictType;
    sysDictData.statusFlag = STATUS_YES;

    // 指定字典类型
    if (dictType === '*' || dictType === '') {
      sysDictData.dictType = '';
    }

    const arr = await this.sysDictDataRepository.select(sysDictData);
    if (arr.length === 0) {
      return;
    }

    // 将字典数据按类型分组
    const m: Map<string, SysDictData[]> = new Map();
    for (const v of arr) {
      const key = v.dictType;
      if (m[key]) {
        m[key].push(v);
      } else {
        m[key] = [v];
      }
    }

    // 放入缓存
    for (const [k, v] of m) {
      const key = CACHE_SYS_DICT + ':' + k;
      await this.redisCache.del('', key);
      await this.redisCache.set('', key, JSON.stringify(v));
    }
  }

  /**
   * 清空字典缓存数据
   * @param dictType 字典类型 传入*清除全部
   * @returns 结果
   */
  public async cacheClean(dictType: string): Promise<boolean> {
    const key = CACHE_SYS_DICT + ':' + dictType;
    const keys = await this.redisCache.getKeys('', key);
    const rows = await this.redisCache.delKeys('', keys);
    return rows > 0;
  }

  /**
   * 导出数据表格
   * @param rows 信息
   * @param fileName 文件名
   * @returns 结果
   */
  public async exportData(rows: SysDictType[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const row of rows) {
      let statusValue = '停用';
      if (row.statusFlag === '1') {
        statusValue = '正常';
      }
      const data = {
        字典编号: row.dictId,
        字典名称: row.dictName,
        字典类型: row.dictType,
        字典状态: statusValue,
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }
}
