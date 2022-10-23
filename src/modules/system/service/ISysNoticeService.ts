import { SysNotice } from '../model/SysNotice';

/**
 * 公告 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysNoticeService {
  /**
   * 分页查询公告列表
   *
   * @param query 请求参数
   * @return 列表数据结果
   */
  selectNoticePage(query: any): Promise<rowPages>;

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
  insertNotice(sysNotice: SysNotice): Promise<number>;

  /**
   * 修改公告
   *
   * @param sysNotice 公告信息
   * @return 结果
   */
  updateNotice(sysNotice: SysNotice): Promise<number>;

  /**
   * 删除公告信息
   *
   * @param noticeId 公告ID
   * @return 结果
   */
  deleteNoticeById(noticeId: string): Promise<number>;

  /**
   * 批量删除公告信息
   *
   * @param noticeIds 需要删除的公告ID
   * @return 结果
   */
  deleteNoticeByIds(noticeIds: string[]): Promise<number>;
}
