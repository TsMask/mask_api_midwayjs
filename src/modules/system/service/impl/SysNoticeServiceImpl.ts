import { Provide, Inject } from '@midwayjs/decorator';
import { SysNotice } from '../../model/SysNotice';
import { SysNoticeRepositoryImpl } from '../../repository/impl/SysNoticeRepositoryImpl';
import { ISysNoticeService } from '../ISysNoticeService';

/**
 * 公告 业务层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysNoticeServiceImpl implements ISysNoticeService {
  @Inject()
  private sysNoticeRepository: SysNoticeRepositoryImpl;

  async selectNoticePage(query: any): Promise<rowPages> {
    return await this.sysNoticeRepository.selectNoticePage(query);
  }
  async selectNoticeById(noticeId: string): Promise<SysNotice> {
    return await this.sysNoticeRepository.selectNoticeById(noticeId);
  }
  async selectNoticeList(sysNotice: SysNotice): Promise<SysNotice[]> {
    return await this.sysNoticeRepository.selectNoticeList(sysNotice);
  }
  async insertNotice(sysNotice: SysNotice): Promise<number> {
    return await this.sysNoticeRepository.insertNotice(sysNotice);
  }
  async updateNotice(sysNotice: SysNotice): Promise<number> {
    return await this.sysNoticeRepository.updateNotice(sysNotice);
  }
  async deleteNoticeById(noticeId: string): Promise<number> {
    return await this.sysNoticeRepository.deleteNoticeById(noticeId);
  }
  async deleteNoticeByIds(noticeIds: string[]): Promise<number> {
    return await this.sysNoticeRepository.deleteNoticeByIds(noticeIds);
  }
}
