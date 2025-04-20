import {
  Controller,
  Body,
  Post,
  Get,
  Inject,
  Query,
  Param,
  Put,
  Del,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { loginUserToUserName } from '../../../framework/reqctx/auth';
import { Oauth2ClientService } from '../service/oauth2_client';
import { Resp } from '../../../framework/resp/api';
import { Oauth2Client } from '../model/oauth2_client';

/**客户端授权管理 控制层处理 */
@Controller('/oauth2/client')
export class Oauth2ClientController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**用户授权第三方应用信息服务 */
  @Inject()
  private oauth2ClientService: Oauth2ClientService;

  /**列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ matchRoles: ['admin'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.oauth2ClientService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**信息 */
  @Get('/:clientId', {
    middleware: [AuthorizeUserMiddleware({ matchRoles: ['admin'] })],
  })
  public async info(@Param('clientId') clientId: string): Promise<Resp> {
    if (clientId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: clientId is empty');
    }
    const data = await this.oauth2ClientService.findByClientId(clientId);
    if (data.clientId === clientId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ matchRoles: ['admin'] }),
      OperateLogMiddleware({
        title: '客户端授权管理',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: Oauth2Client) {
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: id not is empty');
    }

    const localHost =
      body.ipWhite.includes('127.0.0.1') ||
      body.ipWhite.includes('localhost') ||
      body.ipWhite.includes('::1');
    if (localHost || body.ipWhite.includes('::ffff:')) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'no support local host');
    }

    body.createBy = loginUserToUserName(this.c);
    const insertId = await this.oauth2ClientService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**更新 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ matchRoles: ['admin'] }),
      OperateLogMiddleware({
        title: '客户端授权管理',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: Oauth2Client) {
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: id is empty');
    }

    const localHost =
      body.ipWhite.includes('127.0.0.1') ||
      body.ipWhite.includes('localhost') ||
      body.ipWhite.includes('::1');
    if (localHost || body.ipWhite.includes('::ffff:')) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'no support local host');
    }

    // 查询信息
    const info = await this.oauth2ClientService.findByClientId(body.clientId);
    if (info.clientId != body.clientId) {
      return Resp.errMsg('修改失败，客户端ID已存在');
    }

    info.title = body.title;
    info.ipWhite = body.ipWhite;
    info.remark = body.remark;
    info.updateBy = loginUserToUserName(this.c);
    const rows = await this.oauth2ClientService.update(info);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ matchRoles: ['admin'] }),
      OperateLogMiddleware({
        title: '客户端授权管理',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(@Param('id') id: string) {
    if (id === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: id is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(id, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.oauth2ClientService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }
}
