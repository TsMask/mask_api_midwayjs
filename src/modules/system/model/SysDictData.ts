/**
 * 字典数据表 sys_dict_data
 *
 * @author TsMask
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

  /**是否默认（N否 Y是） */
  isDefault: string;

  /**状态（0停用 1正常） */
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
