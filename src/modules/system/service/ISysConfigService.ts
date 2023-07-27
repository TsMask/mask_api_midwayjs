import { SysConfig } from '../model/SysConfig';

/**
 * 参数配置 服务层接口
 *
 * @author TsMask
 */
export interface ISysConfigService {
  /**
   * 分页查询参数配置列表数据
   *
   * @param query 请求参数
   * @return 列表数据结果
   */
  selectConfigPage(query: ListQueryPageOptions): Promise<RowPagesType>;

  /**
   * 查询参数配置信息
   *
   * @param configId 参数配置ID
   * @return 参数配置信息
   */
  selectConfigById(configId: string): Promise<SysConfig>;

  /**
   * 根据键名查询参数配置信息
   *
   * @param configKey 参数键名
   * @return 参数键值
   */
  selectConfigValueByKey(configKey: string): Promise<string>;

  /**
   * 查询参数配置列表
   *
   * @param sysConfig 参数配置信息
   * @return 参数配置集合
   */
  selectConfigList(sysConfig: SysConfig): Promise<SysConfig[]>;

  /**
   * 校验参数键名是否唯一
   *
   * @param configKey 参数键名
   * @param configId 参数ID，更新时传入
   * @return 结果
   */
  checkUniqueConfigKey(configKey: string, configId: string): Promise<boolean>;

  /**
   * 新增参数配置
   *
   * @param sysConfig 参数配置信息
   * @return 结果
   */
  insertConfig(sysConfig: SysConfig): Promise<string>;

  /**
   * 修改参数配置
   *
   * @param sysConfig 参数配置信息
   * @return 结果
   */
  updateConfig(sysConfig: SysConfig): Promise<number>;

  /**
   * 批量删除参数信息
   *
   * @param configIds 需要删除的参数ID
   */
  deleteConfigByIds(configIds: string[]): Promise<number>;

  /**
   * 重置参数缓存数据
   */
  resetConfigCache(): Promise<void>;
}
