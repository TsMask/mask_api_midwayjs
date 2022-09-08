type SysConfig = object;

/**
 * 参数配置 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysConfigRepoInterface {
  /**
   * 查询参数配置信息
   *
   * @param sys_config 参数配置信息
   * @return 参数配置信息
   */
  select_config(sys_config: SysConfig): Promise<SysConfig>;

  /**
   * 查询参数配置列表
   *
   * @param sys_config 参数配置信息
   * @return 参数配置集合
   */
  select_config_list(sys_config: SysConfig): Promise<SysConfig[]>;

  /**
   * 根据键名查询参数配置信息
   *
   * @param config_key 参数键名
   * @return 参数配置信息
   */
  check_unique_config_key(config_key: string): Promise<SysConfig>;

  /**
   * 新增参数配置
   *
   * @param sys_config 参数配置信息
   * @return 结果
   */
  insert_config(sys_config: SysConfig): Promise<number>;

  /**
   * 修改参数配置
   *
   * @param sys_config 参数配置信息
   * @return 结果
   */
  updateConfig(sys_config: SysConfig): Promise<number>;

  /**
   * 删除参数配置
   *
   * @param config_id 参数ID
   * @return 结果
   */
  deleteConfigById(config_id: string): Promise<number>;

  /**
   * 批量删除参数信息
   *
   * @param config_ids 需要删除的参数ID
   * @return 结果
   */
  deleteConfigByIds(config_ids: string[]): Promise<number>;
}
