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
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../internal/shared/parse/parse';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { loginUserToUserName } from '../../../internal/web/reqctx/auth';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { NOTICE_STATUS_DELETED } from '../../../internal/shared/constants/notice';
import { SysNoticeService } from '../service/sys_notice';
import { SysNotice } from '../model/sys_notice';

/**通知公告信息 控制层处理 */
@Controller('/api/v1/system/notices')
export class SysNoticeController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**公告服务 */
  @Inject()
  private sysNoticeService: SysNoticeService;

  /**通知公告列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:notice:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysNoticeService.findByPage(query);
    return Resp.okData({ rows: rows, total });
  }

  /**通知公告信息 */
  @Get('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:notice:query'] }),
    ],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') noticeId: number
  ): Promise<Resp> {
    if (noticeId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: noticeId is empty');
    }
    const data = await this.sysNoticeService.findById(noticeId);
    if (data.id === noticeId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**通知公告新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:notice:add'] }),
      OperateLogMiddleware({
        title: '通知公告信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysNotice): Promise<Resp> {
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: noticeId not is empty');
    }
    body.create_by = loginUserToUserName(this.c);
    const insertId = await this.sysNoticeService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**通知公告修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:notice:edit'] }),
      OperateLogMiddleware({
        title: '通知公告信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysNotice): Promise<Resp> {
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: noticeId is empty');
    }
    // 检查是否存在
    const noticeInfo = await this.sysNoticeService.findById(body.id);
    if (noticeInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问公告信息数据！');
    }
    if (body.notice_status === NOTICE_STATUS_DELETED) {
      return Resp.errMsg('公告状态不能选择已删除，请使用删除操作');
    }

    const noticeChanged = (
      [
        ['notice_title', body.notice_title],
        ['notice_type', body.notice_type],
        ['notice_content', body.notice_content],
        ['notice_status', body.notice_status],
        ['remark', body.remark],
      ] as Array<[keyof SysNotice, SysNotice[keyof SysNotice]]>
    ).some(([field, value]) => value !== undefined && noticeInfo[field] !== value);
    if (!noticeChanged) {
      return Resp.ok();
    }

    const noticeStatusUnchanged =
      body.notice_status === noticeInfo.notice_status;
    noticeInfo.notice_title = body.notice_title;
    noticeInfo.notice_type = body.notice_type;
    noticeInfo.notice_content = body.notice_content;
    noticeInfo.notice_status = body.notice_status;
    noticeInfo.remark = body.remark;
    if (noticeStatusUnchanged) {
      delete (noticeInfo as Partial<SysNotice>).notice_status;
    }
    noticeInfo.update_by = loginUserToUserName(this.c);
    const rows = await this.sysNoticeService.update(noticeInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**通知公告删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:notice:remove'] }),
      OperateLogMiddleware({
        title: '通知公告信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.string().allow('')) @Param('id') noticeId: string
  ): Promise<Resp> {
    if (noticeId === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: noticeId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(noticeId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysNoticeService.deleteByIds(
      ids,
      loginUserToUserName(this.c)
    );
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功：${rows}`);
  }
}
