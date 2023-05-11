import { Provide, Inject, Singleton } from '@midwayjs/decorator';
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
    return await this.sysNoticeRepository.selectNoticeById(noticeId);
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
    return await this.sysNoticeRepository.deleteNoticeByIds(noticeIds);
  }
}
