/**
 * 通知公告表 sys_notice
 *
 * @author TsMask <340112800@qq.com>
 */
export class SysNotice {
  /**公告ID */
  noticeId: number;

  /**公告标题 */
  noticeTitle: string;

  /**公告类型（1通知 2公告） */
  noticeType: string;

  /**公告内容 */
  noticeContent: string;

  /**公告状态（0正常 1关闭） */
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
