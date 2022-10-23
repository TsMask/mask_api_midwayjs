import { Provide, Inject, Init, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SYS_CONFIG_KEY } from '../../../../common/constants/CacheKeysConstants';
import { YES } from '../../../../common/constants/UserConstants';
import { parseBoolean } from '../../../../common/utils/ParseUtils';
import { RedisCache } from '../../../../framework/redis/RedisCache';
import { SysConfig } from '../../model/SysConfig';
import { SysConfigRepositoryImpl } from '../../repository/impl/SysConfigRepositoryImpl';
import { ISysConfigService } from '../ISysConfigService';

/**
 * 参数配置 服务层实现
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysConfigServiceImpl implements ISysConfigService {
  @Inject()
  private sysConfigRepository: SysConfigRepositoryImpl;

  @Inject()
  private redisCache: RedisCache;

  /**
   * 设置cache key
   * @param configKey 参数键
   * @return 缓存键key
   */
  private cacheKey(configKey: string): string {
    return SYS_CONFIG_KEY + configKey;
  }

  /**
   * 启动时，初始化参数到缓存
   */
  @Init()
  async init() {
    await this.loadingConfigCache();
  }

  async selectConfigPage(query: any): Promise<rowPages> {
    return await this.sysConfigRepository.selectConfigPage(query);
  }

  async selectConfigById(configId: number): Promise<SysConfig> {
    const sysConfig = new SysConfig();
    sysConfig.configId = configId;
    return await this.sysConfigRepository.selectConfig(sysConfig);
  }

  async selectConfigByKey(configKey: string): Promise<string> {
    // 从缓存中读取
    const cacheValue = await this.redisCache.get(this.cacheKey(configKey));
    if (cacheValue) {
      return cacheValue;
    }
    // 无缓存时读取数据放入缓存中
    const config = new SysConfig();
    config.configKey = configKey;
    const retConfig = await this.sysConfigRepository.selectConfig(config);
    if (retConfig) {
      await this.redisCache.set(this.cacheKey(configKey), retConfig.configKey);
      return retConfig.configValue;
    }
    return null;
  }

  async selectCaptchaEnabled(): Promise<boolean> {
    const captchaEnabled = await this.selectConfigByKey(
      'sys.account.captchaEnabled'
    );
    if (captchaEnabled) {
      return parseBoolean(captchaEnabled);
    }
    return true;
  }

  async selectConfigList(sysConfig: SysConfig): Promise<SysConfig[]> {
    return await this.sysConfigRepository.selectConfigList(sysConfig);
  }

  async insertConfig(sysConfig: SysConfig): Promise<number> {
    const id = await this.sysConfigRepository.insertConfig(sysConfig);
    if (id) {
      await this.redisCache.set(
        this.cacheKey(sysConfig.configKey),
        sysConfig.configValue
      );
    }
    return id;
  }

  async updateConfig(sysConfig: SysConfig): Promise<number> {
    const id = await this.sysConfigRepository.updateConfig(sysConfig);
    if (id) {
      await this.redisCache.set(
        this.cacheKey(sysConfig.configKey),
        sysConfig.configValue
      );
    }
    return id;
  }

  async deleteConfigByIds(configIds: number[]): Promise<number> {
    let num = 0;
    for (const configId of configIds) {
      const config = await this.selectConfigById(configId);
      if (!config) continue;
      // 检查是否为内置参数
      if (config.configType === YES) {
        throw new Error(`内置参数 ${config.configKey} 不能删除`);
      }
      // 删除并移除缓存
      await this.sysConfigRepository.deleteConfigById(configId);
      num += await this.redisCache.del(this.cacheKey(config.configKey));
    }
    return num;
  }

  async loadingConfigCache(): Promise<void> {
    const configs = await this.selectConfigList(new SysConfig());
    for (const config of configs) {
      this.redisCache.set(this.cacheKey(config.configKey), config.configValue);
    }
  }

  async clearConfigCache(): Promise<number> {
    const keys = await this.redisCache.getKeys(SYS_CONFIG_KEY + '*');
    return await this.redisCache.delKeys(keys);
  }

  async resetConfigCache(): Promise<void> {
    await this.clearConfigCache();
    await this.loadingConfigCache();
  }

  async checkUniqueConfigKey(configKey: string): Promise<SysConfig> {
    return await this.sysConfigRepository.checkUniqueConfigKey(configKey);
  }
}
