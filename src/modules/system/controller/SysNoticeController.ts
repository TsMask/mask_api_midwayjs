import {
  Controller,
  Inject,
  Get,
  Param,
  Post,
  Body,
  Del,
  Put,
} from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { Result } from '../../../framework/model/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysNotice } from '../model/SysNotice';
import { SysNoticeServiceImpl } from '../service/impl/SysNoticeServiceImpl';

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
    return Result.ok(data);
  }

  /**
   * 通知公告信息
   */
  @Get('/:noticeId')
  @PreAuthorize({ hasPermissions: ['system:notice:query'] })
  async getInfo(@Param('noticeId') noticeId: string): Promise<Result> {
    if (!noticeId) return Result.err();
    const data = await this.sysNoticeService.selectNoticeById(noticeId);
    return Result.okData(data);
  }

  /**
   * 通知公告新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:notice:add'] })
  @OperLog({
    title: '通知公告信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() notice: SysNotice): Promise<Result> {
    if (!notice.noticeContent) return Result.err();
    notice.createBy = this.contextService.getUseName();
    const insertId = await this.sysNoticeService.insertNotice(notice);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 通知公告修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:notice:edit'] })
  @OperLog({
    title: '通知公告信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() notice: SysNotice): Promise<Result> {
    if (!notice.noticeId) return Result.err();
    notice.updateBy = this.contextService.getUseName();
    const rows = await this.sysNoticeService.updateNotice(notice);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 通知公告删除
   */
  @Del('/:noticeIds')
  @PreAuthorize({ hasPermissions: ['system:notice:remove'] })
  @OperLog({
    title: '通知公告信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('noticeIds') noticeIds: string): Promise<Result> {
    if (!noticeIds) return Result.err();
    // 处理字符转id数组
    const ids = noticeIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysNoticeService.deleteNoticeByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
