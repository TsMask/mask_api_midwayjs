import {
  Controller,
  Inject,
  Get,
  Param,
  Post,
  Body,
  Del,
  Put,
  Query,
} from '@midwayjs/core';
import { RuleType, Valid } from '@midwayjs/validate';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/reqctx/context';
import { SysNoticeService } from '../service/sys_notice';
import { SysNotice } from '../model/sys_notice';

/**通知公告信息 控制层处理 */
@Controller('/system/notice')
export class SysNoticeController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysNoticeService: SysNoticeService;

  /**
   * 通知公告列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:notice:list'] })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysNoticeService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 通知公告信息
   */
  @Get('/:noticeId')
  @PreAuthorize({ hasPermissions: ['system:notice:query'] })
  public async info(
    @Valid(RuleType.number().required()) @Param('noticeId') noticeId: number
  ): Promise<Resp> {
    if (noticeId <= 0) {
      return Resp.codeMsg(40010, 'bind err: noticeId is empty');
    }
    const data = await this.sysNoticeService.findById(noticeId);
    if (data.noticeId === noticeId) {
      return Resp.okData(data);
    }
    return Resp.err();
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
  public async add(@Body() body: SysNotice): Promise<Resp> {
    if (body.noticeId > 0) {
      return Resp.codeMsg(40010, 'bind err: noticeId not is empty');
    }

    body.createBy = this.contextService.getUseName();
    const insertId = await this.sysNoticeService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
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
  public async edit(@Body() body: SysNotice): Promise<Resp> {
    if (body.noticeId <= 0) {
      return Resp.codeMsg(40010, 'bind err: noticeId is empty');
    }

    // 检查是否存在
    const noticeInfo = await this.sysNoticeService.findById(body.noticeId);
    if (noticeInfo.noticeId != body.noticeId) {
      return Resp.errMsg('没有权限访问公告信息数据！');
    }

    noticeInfo.noticeTitle = body.noticeTitle;
    noticeInfo.noticeType = body.noticeType;
    noticeInfo.noticeContent = body.noticeContent;
    noticeInfo.statusFlag = body.statusFlag;
    noticeInfo.remark = body.remark;
    noticeInfo.updateBy = this.contextService.getUseName();
    const rows = await this.sysNoticeService.update(noticeInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 通知公告删除
   */
  @Del('/:noticeId')
  @PreAuthorize({ hasPermissions: ['system:notice:remove'] })
  @OperateLog({
    title: '通知公告信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  public async remove(
    @Valid(RuleType.number().required()) @Param('noticeId') noticeId: string
  ): Promise<Resp> {
    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(noticeId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));
    const rows = await this.sysNoticeService.deleteByIds(ids);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }
}
