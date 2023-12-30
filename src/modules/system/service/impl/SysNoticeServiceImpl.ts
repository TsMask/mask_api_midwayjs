import { Provide, Inject, Singleton } from '@midwayjs/core';
import { SysNotice } from '../../model/SysNotice';
import { SysNoticeRepositoryImpl } from '../../repository/impl/SysNoticeRepositoryImpl';
import { ISysNoticeService } from '../ISysNoticeService';

/**
 * 公告 业务层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysNoticeServiceImpl implements ISysNoticeService {
  @Inject()
  private sysNoticeRepository: SysNoticeRepositoryImpl;

  async selectNoticePage(query: ListQueryPageOptions): Promise<RowPagesType> {
    return await this.sysNoticeRepository.selectNoticePage(query);
  }
  async selectNoticeById(noticeId: string): Promise<SysNotice> {
    if (!noticeId) return null;
    const configs = await this.sysNoticeRepository.selectNoticeByIds([
      noticeId,
    ]);
    if (configs.length > 0) {
      return configs[0];
    }
    return null;
  }
  async selectNoticeList(sysNotice: SysNotice): Promise<SysNotice[]> {
    return await this.sysNoticeRepository.selectNoticeList(sysNotice);
  }
  async insertNotice(sysNotice: SysNotice): Promise<string> {
    return await this.sysNoticeRepository.insertNotice(sysNotice);
  }
  async updateNotice(sysNotice: SysNotice): Promise<number> {
    return await this.sysNoticeRepository.updateNotice(sysNotice);
  }
  async deleteNoticeByIds(noticeIds: string[]): Promise<number> {
    const notices = await this.sysNoticeRepository.selectNoticeByIds(noticeIds);
    if (notices.length <= 0) {
      throw new Error('没有权限访问公告信息数据！');
    }
    for (const notice of notices) {
      // 检查是否为已删除
      if (notice.delFlag === '1') {
        throw new Error(`公告信息 ${notice.noticeTitle} 已经删除`);
      }
    }
    if (notices.length === noticeIds.length) {
      return await this.sysNoticeRepository.deleteNoticeByIds(noticeIds);
    }
    return 0;
  }
}
