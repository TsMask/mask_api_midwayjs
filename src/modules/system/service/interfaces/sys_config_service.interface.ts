import { PageBody } from '../../../../framework/core/page_body';
import { PageData } from '../../../../framework/core/page_data';
import { SysConfig } from '../../model/sys_config';

/**
 * 参数配置 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysConfigServiceInterface {
  /**
   * 分页查询参数配置列表数据
   *
   * @param page_body 请求参数
   * @return 列表数据结果
   */
  select_config_page(
    page_body: PageBody<SysConfig>
  ): Promise<PageData<SysConfig>>;

  /**
   * 查询参数配置信息
   *
   * @param config_id 参数配置ID
   * @return 参数配置信息
   */
  select_config_by_id(config_id: number): Promise<SysConfig>;

  /**
   * 根据键名查询参数配置信息
   *
   * @param config_key 参数键名
   * @return 参数键值
   */
  select_config_by_key(config_key: string): Promise<string>;

  /**
   * 获取验证码开关
   *
   * @return true开启，false关闭
   */
  select_captcha_enabled(): Promise<boolean>;

  /**
   * 查询参数配置列表
   *
   * @param sys_config 参数配置信息
   * @return 参数配置集合
   */
  select_config_list(sys_config: SysConfig): Promise<SysConfig[]>;

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
  update_config(sys_config: SysConfig): Promise<number>;

  /**
   * 批量删除参数信息
   *
   * @param config_ids 需要删除的参数ID
   */
  delete_config_by_ids(config_ids: number[]): Promise<number>;

  /**
   * 加载参数缓存数据
   */
  loading_config_cache(): Promise<void>;

  /**
   * 清空参数缓存数据
   */
  clear_config_cache(): Promise<number>;

  /**
   * 重置参数缓存数据
   */
  reset_config_cache(): Promise<void>;

  /**
   * 校验参数键名是否唯一
   *
   * @param config_key 参数信息
   * @return 结果
   */
  check_unique_config_key(config_key: string): Promise<SysConfig>;
}
