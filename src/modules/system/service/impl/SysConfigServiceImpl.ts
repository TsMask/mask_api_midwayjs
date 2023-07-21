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

  async selectConfigPage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysConfigRepository.selectConfigPage(query);
  }

  async selectConfigById(configId: string): Promise<SysConfig> {
    if (!configId) return null;
    const configs = await this.sysConfigRepository.selectConfigByIds([
      configId,
    ]);
    if (configs.length > 0) {
      return configs[0];
    }
    return null;
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

  async checkUniqueConfigKey(
    configKey: string,
    configId: string = ''
  ): Promise<boolean> {
    const sysConfig = new SysConfig();
    sysConfig.configKey = configKey;
    const uniqueId = await this.sysConfigRepository.checkUniqueConfig(
      sysConfig
    );
    if (uniqueId === configId) {
      return true;
    }
    return !uniqueId;
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
    const configs = await this.sysConfigRepository.selectConfigByIds(configIds);
    if (configs.length <= 0) {
      throw new Error('没有权限访问参数配置数据！');
    }
    for (const config of configs) {
      // 检查是否为内置参数
      if (config.configType === 'Y') {
        throw new Error(`内置参数 ${config.configKey} 不能删除`);
      }
      // 清除缓存
      await this.clearConfigCache(config.configKey);
    }
    if (configs.length === configIds.length) {
      return await this.sysConfigRepository.deleteConfigByIds(configIds);
    }
    return 0;
  }

  async resetConfigCache(): Promise<void> {
    await this.clearConfigCache('*');
    await this.loadingConfigCache('*');
  }

  /**
   * 组装缓存key
   * @param configKey 参数键
   * @return 缓存键key
   */
  private cacheKey(configKey: string): string {
    return SYS_CONFIG_KEY + configKey;
  }

  /**
   * 加载参数缓存数据
   * @param configKey 参数键名，不指定即加载所有
   */
  private async loadingConfigCache(configKey: string): Promise<void> {
    if (configKey === '*') {
      // 查询全部参数
      const sysConfigs = await this.selectConfigList(new SysConfig());
      for (const sysConfig of sysConfigs) {
        const key = this.cacheKey(sysConfig.configKey);
        await this.redisCache.del(key);
        await this.redisCache.set(key, sysConfig.configValue);
      }
      return;
    }
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
    }
  }

  /**
   * 清空参数缓存数据
   *  @param configKey 参数键名，不指定即清除所有
   */
  private async clearConfigCache(configKey: string): Promise<number> {
    const key = this.cacheKey(configKey);
    const keys = await this.redisCache.getKeys(key);
    return await this.redisCache.delKeys(keys);
  }
}
