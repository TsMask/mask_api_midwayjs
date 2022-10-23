/**
 * 字典数据表 sys_dict_data
 *
 * @author TsMask <340112800@qq.com>
 */
export class SysDictData {
  /**字典编码 */
  dictCode: string;

  /**字典排序 */
  dictSort: number;

  /**字典标签 */
  dictLabel: string;

  /**字典键值 */
  dictValue: string;

  /**字典类型 */
  dictType: string;

  /**样式属性（其他样式扩展） */
  cssClass: string;

  /**表格回显样式 */
  listClass: string;

  /**是否默认（Y是 N否） */
  isDefault: string;

  /**状态（0正常 1停用） */
  status: string;

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
