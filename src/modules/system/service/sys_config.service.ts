import { Provide, Inject, Init, ScopeEnum, Scope } from '@midwayjs/decorator';
import { SYS_CONFIG_KEY } from '../../../common/constant/cache_keys';
import { YES } from '../../../common/constant/param';
import { parse_boolean } from '../../../common/utils/parse.utils';
import { PageBody } from '../../../framework/core/page_body';
import { PageData } from '../../../framework/core/page_data';
import { RedisCache } from '../../../framework/redis/redis_cache';
import { SysConfig } from '../model/sys_config';
import { SysConfigRepo } from '../repository/sys_config.repo';
import { SysConfigServiceInterface } from './interfaces/sys_config_service.interface';

/**
 * 参数配置 服务层实现
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysConfigService implements SysConfigServiceInterface {
  @Inject()
  private sys_config_repo: SysConfigRepo;

  @Inject()
  private redis_cache: RedisCache;

  /**
   * 设置cache key
   * @param config_key 参数键
   * @return 缓存键key
   */
  private cache_key(config_key: string): string {
    return SYS_CONFIG_KEY + config_key;
  }

  /**
   * 启动时，初始化参数到缓存
   */
  @Init()
  async init() {
    await this.loading_config_cache();
  }

  async select_config_page(
    page_body: PageBody<SysConfig>
  ): Promise<PageData<SysConfig>> {
    return await this.sys_config_repo.select_config_page(page_body);
  }

  async select_config_by_id(config_id: number): Promise<SysConfig> {
    const config = new SysConfig();
    config.config_id = config_id;
    return await this.sys_config_repo.select_config(config);
  }

  async select_config_by_key(config_key: string): Promise<string> {
    // 从缓存中读取
    const cache_value = await this.redis_cache.get(this.cache_key(config_key));
    if (cache_value) {
      return cache_value;
    }
    // 无缓存时读取数据放入缓存中
    const config = new SysConfig();
    config.config_key = config_key;
    const ret_config = await this.sys_config_repo.select_config(config);
    if (ret_config) {
      await this.redis_cache.set(
        this.cache_key(config_key),
        ret_config.config_value
      );
      return ret_config.config_value;
    }
    return '';
  }

  async select_captcha_enabled(): Promise<boolean> {
    const captcha_enabled = await this.select_config_by_key(
      'sys.account.captchaEnabled'
    );
    if (captcha_enabled) {
      return parse_boolean(captcha_enabled);
    }
    return true;
  }

  async select_config_list(sys_config: SysConfig): Promise<SysConfig[]> {
    return await this.sys_config_repo.select_config_list(sys_config);
  }

  async insert_config(sys_config: SysConfig): Promise<number> {
    const row = await this.sys_config_repo.insert_config(sys_config);
    if (row > 0) {
      await this.redis_cache.set(this.cache_key(sys_config.config_key), sys_config.config_value);
    }
    return row;
  }

  async update_config(sys_config: SysConfig): Promise<number> {
    const row = await this.sys_config_repo.update_config(sys_config);
    if (row > 0) {
      await this.redis_cache.set(this.cache_key(sys_config.config_key), sys_config.config_value);
    }
    return row;
  }

  async delete_config_by_ids(config_ids: number[]): Promise<number> {
    let num = 0;
    for(const config_id of config_ids){
      // 检查是否为内置参数
      const config = await this.select_config_by_id(config_id);
      if(config.config_type === YES){
        throw new Error(`内置参数 ${config.config_key} 不能删除`);
      }
      // 删除并移除缓存
      await this.sys_config_repo.delete_config_by_id(config_id);
      num += await this.redis_cache.del(this.cache_key(config.config_key));
    }
    return num;
  }

  async loading_config_cache(): Promise<void> {
    const configs = await this.select_config_list(new SysConfig());
    for (const config of configs) {
      this.redis_cache.set(
        this.cache_key(config.config_key),
        config.config_value
      );
    }
  }

  async clear_config_cache(): Promise<number> {
    const keys = await this.redis_cache.get_keys(SYS_CONFIG_KEY + "*");
    return await this.redis_cache.del_keys(keys);
  }

  async reset_config_cache(): Promise<void> {
    await this.clear_config_cache();
    await this.loading_config_cache();
  }

  async check_unique_config_key(config_key: string): Promise<SysConfig> {
    return await this.sys_config_repo.check_unique_config_key(config_key);
  }
}
