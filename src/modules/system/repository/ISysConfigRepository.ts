import { SysConfig } from '../model/SysConfig';

/**
 * 参数配置 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysConfigRepository {
  /**
   * 分页查询参数配置列表数据
   *
   * @param query 请求参数
   * @return 列表数据结果
   */
  selectConfigPage(query: any): Promise<rowPages>;

  /**
   * 查询参数配置列表
   *
   * @param sysConfig 参数配置信息
   * @return 参数配置集合
   */
  selectConfigList(sysConfig: SysConfig): Promise<SysConfig[]>;
  /**
   * 通过参数键名查询参数键值
   *
   * @param configKey 参数键名
   * @return 用户对象信息
   */
  selectconfigValueByKey(configKey: string): Promise<string>;

  /**
   * 通过配置ID查询参数配置信息
   *
   * @param configId 参数配置ID
   * @return 用户对象信息
   */
  selectConfigById(configId: string): Promise<SysConfig>;

  /**
   * 校验参数键名是否唯一
   *
   * @param configKey 参数键名
   * @return 结果
   */
  checkUniqueConfigKey(configKey: string): Promise<string>;

  /**
   * 校验参数键值是否唯一
   *
   * @param configValue 参数键值
   * @return 结果
   */
  checkUniqueConfigValue(configValue: string): Promise<string>;

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
   * 批量删除参数配置信息
   *
   * @param configId 需要删除的参数ID
   * @return 结果
   */
  deleteConfigByIds(configId: string[]): Promise<number>;
}
