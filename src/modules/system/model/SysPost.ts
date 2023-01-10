/**
 * 岗位表 sys_post
 *
 * @author TsMask
 */
export class SysPost {
  /**岗位ID */
  postId: string;

  /**岗位编码 */
  postCode: string;

  /**岗位名称 */
  postName: string;

  /**显示顺序 */
  postSort: number;

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
