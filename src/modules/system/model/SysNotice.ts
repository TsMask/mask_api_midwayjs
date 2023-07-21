/**
 * 通知公告表 sys_notice
 *
 * @author TsMask
 */
export class SysNotice {
  /**公告ID */
  noticeId: string;

  /**公告标题 */
  noticeTitle: string;

  /**公告类型（1通知 2公告） */
  noticeType: string;

  /**公告内容 */
  noticeContent: string;

  /**公告状态（0关闭 1正常） */
  status: string;

  /**删除标志（0代表存在 1代表删除） */
  delFlag: string;

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
