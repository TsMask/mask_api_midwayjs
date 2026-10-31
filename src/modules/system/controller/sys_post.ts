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
import { Resp } from '../../../internal/web/resp/api';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { loginUserToUserName } from '../../../internal/web/reqctx/auth';
import { SysPostService } from '../service/sys_post';
import { SysPost } from '../model/sys_post';
import { serializeSysPost } from '../model/vo/response';

/**岗位信息 控制层处理*/
@Controller('/api/v1/system/posts')
export class SysPostController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**岗位服务 */
  @Inject()
  private sysPostService: SysPostService;

  /**岗位列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:post:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysPostService.findByPage(query);
    return Resp.okData({ rows: rows.map(serializeSysPost), total });
  }

  /**岗位信息 */
  @Get('/:id', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:post:query'] })],
  })
  public async info(
    @Valid(Joi.number()) @Param('id') postId: number
  ): Promise<Resp> {
    if (postId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: postId is empty');
    }
    const data = await this.sysPostService.findById(postId);
    if (data.id === postId) {
      return Resp.okData(serializeSysPost(data));
    }
    return Resp.err();
  }

  /**岗位新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:post:add'] }),
      OperateLogMiddleware({
        title: '岗位信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysPost): Promise<Resp> {
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: postId not is empty');
    }
    // 检查名称唯一
    const uniqueuName = await this.sysPostService.checkUniqueByName(
      body.postName,
      0
    );
    if (!uniqueuName) {
      return Resp.errMsg(`岗位新增【${body.postName}】失败，岗位名称已存在`);
    }
    // 检查编码属性值唯一
    const uniqueCode = await this.sysPostService.checkUniqueByCode(
      body.postCode,
      0
    );
    if (!uniqueCode) {
      return Resp.errMsg(`岗位新增【${body.postName}】失败，岗位名称已存在`);
    }

    body.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysPostService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**岗位修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:post:edit'] }),
      OperateLogMiddleware({
        title: '岗位信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysPost): Promise<Resp> {
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: postId is empty');
    }

    // 检查是否存在
    const postInfo = await this.sysPostService.findById(body.id);
    if (postInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问岗位数据！');
    }

    // 检查名称属性值唯一
    const uniqueuName = await this.sysPostService.checkUniqueByName(
      body.postName,
      body.id
    );
    if (!uniqueuName) {
      return Resp.errMsg(`岗位修改【${body.postName}】失败，岗位名称已存在`);
    }

    // 检查编码属性值唯一
    const uniqueCode = await this.sysPostService.checkUniqueByCode(
      body.postCode,
      body.id
    );
    if (!uniqueCode) {
      return Resp.errMsg(`岗位修改【${body.postName}】失败，岗位名称已存在`);
    }

    postInfo.postCode = body.postCode;
    postInfo.postName = body.postName;
    postInfo.postSort = body.postSort;
    postInfo.postStatus = body.postStatus;
    postInfo.remark = body.remark;
    postInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysPostService.update(postInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**岗位删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:post:remove'] }),
      OperateLogMiddleware({
        title: '岗位信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.string().allow('')) @Param('id') postId: string
  ): Promise<Resp> {
    if (postId === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: postId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(postId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysPostService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }

  /**导出岗位信息 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:post:export'] }),
      OperateLogMiddleware({
        title: '岗位信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysPostService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `post_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysPostService.exportData(rows, fileName);
  }
}