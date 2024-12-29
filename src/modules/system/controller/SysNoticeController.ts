import {
  Controller,
  Inject,
  Get,
  Param,
  Post,
  Body,
  Del,
  Put,
} from '@midwayjs/core';

import { Resp } from '../../../framework/resp/api';
import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysNoticeServiceImpl } from '../service/impl/SysNoticeServiceImpl';
import { SysNotice } from '../model/SysNotice';

/**
 * 通知公告信息
 *
 * @author TsMask
 */
@Controller('/system/notice')
export class SysNoticeController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysNoticeService: SysNoticeServiceImpl;

  /**
   * 通知公告列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:notice:list'] })
  async list(): Promise<Resp> {
    const query = this.contextService.getContext().query;
    const data = await this.sysNoticeService.selectNoticePage(query);
    return Resp.ok(data);
  }

  /**
   * 通知公告信息
   */
  @Get('/:noticeId')
  @PreAuthorize({ hasPermissions: ['system:notice:query'] })
  async getInfo(@Param('noticeId') noticeId: string): Promise<Resp> {
    if (!noticeId) return Resp.err();
    const data = await this.sysNoticeService.selectNoticeById(noticeId);
    return Resp.okData(data);
  }

  /**
   * 通知公告新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:notice:add'] })
  @OperateLog({
    title: '通知公告信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  async add(@Body() notice: SysNotice): Promise<Resp> {
    if (!notice.noticeContent) return Resp.err();
    notice.createBy = this.contextService.getUseName();
    const insertId = await this.sysNoticeService.insertNotice(notice);
    return Resp[insertId ? 'ok' : 'err']();
  }

  /**
   * 通知公告修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:notice:edit'] })
  @OperateLog({
    title: '通知公告信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  async edit(@Body() notice: SysNotice): Promise<Resp> {
    if (!notice.noticeId) return Resp.err();
    notice.updateBy = this.contextService.getUseName();
    const rows = await this.sysNoticeService.updateNotice(notice);
    return Resp[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 通知公告删除
   */
  @Del('/:noticeIds')
  @PreAuthorize({ hasPermissions: ['system:notice:remove'] })
  @OperateLog({
    title: '通知公告信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  async remove(@Param('noticeIds') noticeIds: string): Promise<Resp> {
    if (!noticeIds) return Resp.err();
    // 处理字符转id数组
    const ids = noticeIds.split(',');
    if (ids.length <= 0) return Resp.err();
    const rows = await this.sysNoticeService.deleteNoticeByIds([
      ...new Set(ids),
    ]);
    return Resp[rows > 0 ? 'ok' : 'err']();
  }
}
