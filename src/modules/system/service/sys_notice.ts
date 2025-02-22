import { Provide, Inject, Singleton } from '@midwayjs/core';

import { SysNotice } from '../model/sys_notice';
import { SysNoticeRepository } from '../repository/sys_notice';

/**公告 服务层处理 */
@Provide()
@Singleton()
export class SysNoticeService {
  /**公告服务 */
  @Inject()
  private sysNoticeRepository: SysNoticeRepository;

  /**
   * 分页查询列表数据
   * @param query 参数
   * @returns [rows, total]
   */
  public async findByPage(
    query: Record<string, string>
  ): Promise<[SysNotice[], number]> {
    return await this.sysNoticeRepository.selectByPage(query);
  }

  /**
   * 根据ID查询信息
   * @param noticeId ID
   * @returns 结果
   */
  public async findById(noticeId: number): Promise<SysNotice> {
    if (noticeId <= 0) {
      return new SysNotice();
    }
    const configs = await this.sysNoticeRepository.selectByIds([noticeId]);
    if (configs.length > 0) {
      return configs[0];
    }
    return new SysNotice();
  }

  /**
   * 新增信息
   * @param sysNotice 信息
   * @returns ID
   */
  public async insert(sysNotice: SysNotice): Promise<number> {
    return await this.sysNoticeRepository.insert(sysNotice);
  }

  /**
   * 修改信息
   * @param sysNotice 信息
   * @returns 影响记录数
   */
  public async update(sysNotice: SysNotice): Promise<number> {
    return await this.sysNoticeRepository.update(sysNotice);
  }

  /**
   * 批量删除信息
   * @param noticeIds ID数组
   * @returns [影响记录数, 错误信息]
   */
  public async deleteByIds(noticeIds: number[]): Promise<[number, string]> {
    // 检查是否存在
    const notices = await this.sysNoticeRepository.selectByIds(noticeIds);
    if (notices.length <= 0) {
      return [0, '没有权限访问公告信息数据！'];
    }
    for (const notice of notices) {
      // 检查是否为已删除
      if (notice.delFlag === '1') {
        return [0, `ID:${notice.noticeId} 公告信息已经删除！`];
      }
    }
    if (notices.length === noticeIds.length) {
      const rows = await this.sysNoticeRepository.deleteByIds(noticeIds);
      return [rows, ''];
    }
    return [0, '删除公告信息失败！'];
  }
}
