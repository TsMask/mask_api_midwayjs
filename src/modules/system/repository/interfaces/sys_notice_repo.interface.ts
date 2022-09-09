import { SysNotice } from '../../model/sys_notice';

/**
 * 通知公告表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysMenuRepoInterface {
  /**
   * 查询公告信息
   *
   * @param notice_id 公告ID
   * @return 公告信息
   */
  select_notice_by_id(notice_id: string): Promise<SysNotice>;

  /**
   * 查询公告列表
   *
   * @param sys_notice 公告信息
   * @return 公告集合
   */
  select_notice_list(sys_notice: SysNotice): Promise<SysNotice[]>;

  /**
   * 新增公告
   *
   * @param sys_notice 公告信息
   * @return 结果
   */
  insert_notice(sys_notice: SysNotice): Promise<number>;

  /**
   * 修改公告
   *
   * @param sys_notice 公告信息
   * @return 结果
   */
  update_notice(sys_notice: SysNotice): Promise<number>;

  /**
   * 批量删除公告
   *
   * @param notice_id 公告ID
   * @return 结果
   */
  delete_notice_by_id(notice_id: string): Promise<number>;

  /**
   * 批量删除公告信息
   *
   * @param notice_ids 需要删除的公告ID
   * @return 结果
   */
  delete_notice_by_ids(notice_ids: string[]): Promise<number>;
}
