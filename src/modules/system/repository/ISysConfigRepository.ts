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
   * 查询参数配置信息
   *
   * @param sysConfig 参数配置信息
   * @return 参数配置信息
   */
  selectConfig(sysConfig: SysConfig): Promise<SysConfig>;

  /**
   * 根据键名查询参数配置信息
   *
   * @param configKey 参数键名
   * @return 参数配置信息
   */
  checkUniqueConfigKey(configKey: string): Promise<SysConfig>;

  /**
   * 新增参数配置
   *
   * @param sysConfig 参数配置信息
   * @return 结果
   */
  insertConfig(sysConfig: SysConfig): Promise<number>;

  /**
   * 修改参数配置
   *
   * @param sysConfig 参数配置信息
   * @return 结果
   */
  updateConfig(sysConfig: SysConfig): Promise<number>;

  /**
   * 删除参数配置
   *
   * @param configId 参数ID
   * @return 结果
   */
  deleteConfigById(configId: number): Promise<number>;
}
