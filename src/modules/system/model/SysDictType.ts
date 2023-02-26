/**
 * 字典类型表 sys_dict_type
 *
 * @author TsMask
 */
export class SysDictType {
  /**字典主键 */
  dictId: string;

  /**字典名称 */
  dictName: string;

  /**字典类型 */
  dictType: string;

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
