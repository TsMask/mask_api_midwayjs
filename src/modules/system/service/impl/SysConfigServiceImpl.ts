import { Provide, Inject, Init, Singleton } from '@midwayjs/decorator';
import { SYS_CONFIG_KEY } from '../../../../framework/constants/CacheKeysConstants';
import { RedisCache } from '../../../../framework/cache/RedisCache';
import { SysConfig } from '../../model/SysConfig';
import { SysConfigRepositoryImpl } from '../../repository/impl/SysConfigRepositoryImpl';
import { ISysConfigService } from '../ISysConfigService';

/**
 * 参数配置 服务层实现
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysConfigServiceImpl implements ISysConfigService {
  @Inject()
  private sysConfigRepository: SysConfigRepositoryImpl;

  @Inject()
  private redisCache: RedisCache;

  @Init()
  async init() {
    // 启动时，刷新缓存-参数配置
    await this.resetConfigCache();
  }

  /**
   * 设置cache key
   * @param configKey 参数键
   * @return 缓存键key
   */
  private cacheKey(configKey: string): string {
    return SYS_CONFIG_KEY + configKey;
  }

  async selectConfigPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysConfigRepository.selectConfigPage(query);
  }

  async selectConfigById(configId: string): Promise<SysConfig> {
    return await this.sysConfigRepository.selectConfigById(configId);
  }

  async selectConfigValueByKey(configKey: string): Promise<string> {
    const cacheKey = this.cacheKey(configKey);
    // 从缓存中读取
    const cacheValue = await this.redisCache.get(cacheKey);
    if (cacheValue) {
      return cacheValue;
    }
    // 无缓存时读取数据放入缓存中
    const configValue = await this.sysConfigRepository.selectconfigValueByKey(
      configKey
    );
    if (configValue) {
      await this.redisCache.set(cacheKey, configValue);
      return configValue;
    }
    return null;
  }

  async selectConfigList(sysConfig: SysConfig): Promise<SysConfig[]> {
    return await this.sysConfigRepository.selectConfigList(sysConfig);
  }

  async checkUniqueConfigKey(sysConfig: SysConfig): Promise<boolean> {
    const configId = await this.sysConfigRepository.checkUniqueConfigKey(
      sysConfig.configKey
    );
    // 参数配置与查询得到参数配置configId一致
    if (configId && sysConfig.configId === configId) {
      return true;
    }
    return !configId;
  }

  async insertConfig(sysConfig: SysConfig): Promise<string> {
    const insertId = await this.sysConfigRepository.insertConfig(sysConfig);
    if (insertId) {
      await this.loadingConfigCache(sysConfig.configKey);
    }
    return insertId;
  }

  async updateConfig(sysConfig: SysConfig): Promise<number> {
    const rows = await this.sysConfigRepository.updateConfig(sysConfig);
    if (rows > 0) {
      await this.loadingConfigCache(sysConfig.configKey);
    }
    return rows;
  }

  async deleteConfigByIds(configIds: string[]): Promise<number> {
    for (const configId of configIds) {
      // 检查是否存在
      const config = await this.sysConfigRepository.selectConfigById(configId);
      if (!config) {
        throw new Error('没有权限访问参数配置数据！');
      }
      // 检查是否为内置参数
      if (config.configType === 'Y') {
        throw new Error(`内置参数 ${config.configKey} 不能删除`);
      }
      // 清除缓存
      await this.clearConfigCache(config.configKey);
    }
    return await this.sysConfigRepository.deleteConfigByIds(configIds);
  }

  async loadingConfigCache(configKey?: string): Promise<void> {
    if (configKey) {
      // 指定参数
      const cacheValue = await this.sysConfigRepository.selectconfigValueByKey(
        configKey
      );
      if (cacheValue) {
        const key = this.cacheKey(configKey);
        await this.redisCache.del(key);
        await this.redisCache.set(key, cacheValue);
      }
      return;
    } else {
      // 查询全部参数
      const sysConfigs = await this.selectConfigList(new SysConfig());
      for (const sysConfig of sysConfigs) {
        const key = this.cacheKey(sysConfig.configKey);
        await this.redisCache.del(key);
        await this.redisCache.set(key, sysConfig.configValue);
      }
    }
  }

  async clearConfigCache(configKey = '*'): Promise<number> {
    const key = this.cacheKey(configKey);
    const keys = await this.redisCache.getKeys(key);
    return await this.redisCache.delKeys(keys);
  }

  async resetConfigCache(): Promise<void> {
    await this.clearConfigCache();
    await this.loadingConfigCache();
  }
}
