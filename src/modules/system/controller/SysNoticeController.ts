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

import result from '../../../framework/result/result';
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
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysNoticeService.selectNoticePage(query);
    return result.ok(data);
  }

  /**
   * 通知公告信息
   */
  @Get('/:noticeId')
  @PreAuthorize({ hasPermissions: ['system:notice:query'] })
  async getInfo(@Param('noticeId') noticeId: string): Promise<Result> {
    if (!noticeId) return result.err();
    const data = await this.sysNoticeService.selectNoticeById(noticeId);
    return result.okData(data);
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
  async add(@Body() notice: SysNotice): Promise<Result> {
    if (!notice.noticeContent) return result.err();
    notice.createBy = this.contextService.getUseName();
    const insertId = await this.sysNoticeService.insertNotice(notice);
    return result[insertId ? 'ok' : 'err']();
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
  async edit(@Body() notice: SysNotice): Promise<Result> {
    if (!notice.noticeId) return result.err();
    notice.updateBy = this.contextService.getUseName();
    const rows = await this.sysNoticeService.updateNotice(notice);
    return result[rows > 0 ? 'ok' : 'err']();
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
  async remove(@Param('noticeIds') noticeIds: string): Promise<Result> {
    if (!noticeIds) return result.err();
    // 处理字符转id数组
    const ids = noticeIds.split(',');
    if (ids.length <= 0) return result.err();
    const rows = await this.sysNoticeService.deleteNoticeByIds([
      ...new Set(ids),
    ]);
    return result[rows > 0 ? 'ok' : 'err']();
  }
}
