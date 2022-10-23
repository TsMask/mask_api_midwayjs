/**
 * 参数配置表 sys_config
 *
 * @author TsMask <340112800@qq.com>
 */
export class SysConfig {
  /**参数主键 */
  configId: number;

  /**参数名称 */
  configName: string;

  /**参数键名 */
  configKey: string;

  /**参数键值 */
  configValue: string;

  /**系统内置（Y是 N否） */
  configType: string;

  /**创建者 */
  createBy: string;

  /**创建时间 */
  createTime: number;

  /**更新者 */
  updateBy: string;

  /**更新时间 */
  updateTime: number;

  /**备注 */
  remark: string;
}
