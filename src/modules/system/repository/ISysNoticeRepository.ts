import { SysNotice } from '../model/SysNotice';

/**
 * 通知公告表 数据层接口
 *
 * @author TsMask
 */
export interface ISysNoticeRepository {
  /**
   * 查询公告信息
   *
   * @param noticeId 公告ID
   * @return 公告信息
   */
  selectNoticeById(noticeId: string): Promise<SysNotice>;

  /**
   * 查询公告列表
   *
   * @param sysNotice 公告信息
   * @return 公告集合
   */
  selectNoticeList(sysNotice: SysNotice): Promise<SysNotice[]>;

  /**
   * 新增公告
   *
   * @param sysNotice 公告信息
   * @return 结果
   */
  insertNotice(sysNotice: SysNotice): Promise<string>;

  /**
   * 修改公告
   *
   * @param sysNotice 公告信息
   * @return 结果
   */
  updateNotice(sysNotice: SysNotice): Promise<number>;

  /**
   * 批量删除公告信息
   *
   * @param noticeIds 需要删除的公告ID
   * @return 结果
   */
  deleteNoticeByIds(noticeIds: string[]): Promise<number>;
}
