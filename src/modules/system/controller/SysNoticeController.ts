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
import { Context } from '@midwayjs/koa';
import { Result } from '../../../framework/core/Result';
import { AuthToken } from '../../../framework/decorator/AuthTokenDecorator';
import { SysNotice } from '../model/SysNotice';
import { SysNoticeServiceImpl } from '../service/impl/SysNoticeServiceImpl';

/**
 * 公告信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/notice')
export class SysNoticeController {
  @Inject()
  private ctx: Context;

  @Inject()
  private sysNoticeService: SysNoticeServiceImpl;

  /**
   * 通知公告列表
   * @returns 返回结果
   */
  @Get('/list')
  @AuthToken({ hasPermissions: ['system:notice:list'] })
  async list(): Promise<Result> {
    const query = this.ctx.query;
    const data = await this.sysNoticeService.selectNoticePage(query);
    return Result.ok(data);
  }

  /**
   * 获取通知详细信息
   * @param noticeId 公告ID
   * @returns 返回结果
   */
  @Get('/:noticeId')
  @AuthToken({ hasPermissions: ['system:notice:query'] })
  async getInfo(@Param('noticeId') noticeId: string): Promise<Result> {
    if (!noticeId) return Result.err();
    const data = await this.sysNoticeService.selectNoticeById(noticeId);
    if (data) {
      return Result.okData(data || {});
    }
    return Result.err();
  }

  /**
   * 新增通知公告
   * @param notice 公告实体信息
   * @returns 返回结果
   */
  @Post()
  @AuthToken({ hasPermissions: ['system:notice:add'] })
  async add(@Body() notice: SysNotice): Promise<Result> {
    if (notice && notice.noticeContent) {
      notice.createBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysNoticeService.insertNotice(notice);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.err();
  }

  /**
   * 修改通知公告
   * @param notice 公告实体信息
   * @returns 返回结果
   */
  @Put()
  @AuthToken({ hasPermissions: ['system:notice:edit'] })
  async edit(@Body() notice: SysNotice): Promise<Result> {
    if (notice && notice.noticeId) {
      notice.updateBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysNoticeService.updateNotice(notice);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.err();
  }

  /**
   * 删除通知公告
   * @param noticeIds 格式字符串 "id,id"
   * @returns 返回结果
   */
  @Del('/:noticeIds')
  @AuthToken({ hasPermissions: ['system:notice:remove'] })
  async remove(@Param('noticeIds') noticeIds: string): Promise<Result> {
    if (!noticeIds) return Result.err();
    // 处理字符转id数组
    const ids = noticeIds.split(',');
    const rowNum = await this.sysNoticeService.deleteNoticeByIds(ids);
    return Result[rowNum ? 'ok' : 'err']();
  }
}
