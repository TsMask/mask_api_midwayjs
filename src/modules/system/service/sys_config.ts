import { Provide, Inject, Init, Singleton } from '@midwayjs/core';

import { CACHE_SYS_CONFIG } from '../../../framework/constants/cache_key';
import { RedisCache } from '../../../framework/datasource/redis/redis';
import { FileUtil } from '../../../framework/utils/file/file';
import { SysConfigRepository } from '../repository/sys_config';
import { SysConfig } from '../model/sys_config';

/**参数配置 服务层处理 */
@Provide()
@Singleton()
export class SysConfigService {
  /**参数配置表数据 */
  @Inject()
  private sysConfigRepository: SysConfigRepository;

  /**文件服务 */
  @Inject()
  private fileUtil: FileUtil;

  /**缓存服务 */
  @Inject()
  private redisCache: RedisCache;

  /**初始化 */
  @Init()
  public async init() {
    // 启动时，刷新缓存-参数配置
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
  ): Promise<[SysConfig[], number]> {
    return await this.sysConfigRepository.selectByPage(query);
  }

  /**
   * 通过ID查询信息
   * @param configId ID
   * @returns 结果
   */
  public async findById(configId: number): Promise<SysConfig> {
    if (configId < 0) {
      return new SysConfig();
    }
    const configs = await this.sysConfigRepository.selectByIds([configId]);
    if (configs.length > 0) {
      return configs[0];
    }
    return new SysConfig();
  }

  /**
   * 新增信息
   * @param sysConfig 信息
   * @returns ID
   */
  public async insert(sysConfig: SysConfig): Promise<number> {
    const configId = await this.sysConfigRepository.insert(sysConfig);
    if (configId > 0) {
      await this.cacheLoad(sysConfig.configKey);
    }
    return configId;
  }

  /**
   * 修改信息
   * @param sysConfig 信息
   * @returns 影响记录数
   */
  public async update(sysConfig: SysConfig): Promise<number> {
    const rows = await this.sysConfigRepository.update(sysConfig);
    if (rows > 0) {
      await this.cacheLoad(sysConfig.configKey);
    }
    return rows;
  }

  /**
   * 批量删除信息
   * @param configIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(configIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const configs = await this.sysConfigRepository.selectByIds(configIds);
    if (configs.length <= 0) {
      return [0, '没有权限访问参数配置数据！'];
    }
    for (const config of configs) {
      // 检查是否为内置参数
      if (config.configType === 'Y') {
        return [0, '该配置参数属于内置参数，禁止删除！'];
      }
      // 清除缓存
      this.cacheClean(config.configKey);
    }
    if (configs.length === configIds.length) {
      const rows = await this.sysConfigRepository.deleteByIds(configIds);
      return [rows, ''];
    }
    return [0, '删除参数配置信息失败！'];
  }

  /**
   * 检查参数键名是否唯一
   * @param configKey 配置Key
   * @param configId 配置ID
   * @returns 结果
   */
  public async checkUniqueByKey(
    configKey: string,
    configId: number
  ): Promise<boolean> {
    const sysConfig = new SysConfig();
    sysConfig.configKey = configKey;
    const uniqueId = await this.sysConfigRepository.checkUnique(sysConfig);
    if (uniqueId === configId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 通过参数键名查询参数值
   * @param configKey 配置Key
   * @returns 结果
   */
  public async findValueByKey(configKey: string): Promise<string> {
    const cacheKey = CACHE_SYS_CONFIG + ':' + configKey;
    // 从缓存中读取
    const cacheValue = await this.redisCache.get('', cacheKey);
    if (cacheValue) {
      return cacheValue;
    }
    // 无缓存时读取数据放入缓存中
    const configValue = await this.sysConfigRepository.selectValueByKey(
      configKey
    );
    if (configValue) {
      await this.redisCache.set('', cacheKey, configValue);
      return configValue;
    }
    return '';
  }

  /**
   * 加载参数缓存数据
   * @param configKey 配置Key 传入*查询全部
   * @returns 结果
   */
  public async cacheLoad(configKey: string): Promise<void> {
    // 查询全部参数
    if (configKey === '*' || configKey === '') {
      const sysConfigs = await this.sysConfigRepository.select(new SysConfig());
      for (const v of sysConfigs) {
        const key = CACHE_SYS_CONFIG + ':' + v.configKey;
        await this.redisCache.del('', key);
        await this.redisCache.set('', key, v.configValue);
      }
      return;
    }
    // 指定参数
    const cacheValue = await this.sysConfigRepository.selectValueByKey(
      configKey
    );
    if (cacheValue) {
      const key = CACHE_SYS_CONFIG + ':' + configKey;
      await this.redisCache.del('', key);
      await this.redisCache.set('', key, cacheValue);
    }
  }

  /**
   * 清空参数缓存数据
   * @param configKey 配置Key 传入*清除全部
   * @returns 结果
   */
  public async cacheClean(configKey: string): Promise<boolean> {
    const key = CACHE_SYS_CONFIG + ':' + configKey;
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
  public async exportData(rows: SysConfig[], fileName: string) {
    // 导出数据组装
    const arr: Record<string, any>[] = [];
    for (const row of rows) {
      // 系统内置
      let configType = '否';
      if (row.configType === 'Y') {
        configType = '是';
      }
      const data = {
        参数编号: row.configId,
        参数名称: row.configName,
        参数键名: row.configKey,
        参数键值: row.configValue,
        系统内置: configType,
      };
      arr.push(data);
    }
    return await this.fileUtil.excelWriteRecord(arr, fileName);
  }
}
