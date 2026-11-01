import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
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
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { DemoORM } from '../model/demo_orm';
import { DemoORMService } from '../service/demo_orm';

/**
 * 测试ORM 控制层处理 
 * 更多功能需要查阅 https://midwayjs.org/docs/extensions/orm
 */
@Controller('/api/v1/demo/orms')
export class DemoORMController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**测试ORM信息服务 */
  @Inject()
  private demoORMService: DemoORMService;

  /**列表分页 */
  @Get('/list')
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.demoORMService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**列表无分页 */
  @Get('/all')
  public async all(
    @Valid(
      Joi.object({
        title: Joi.string().allow(''),
        orm_status: Joi.string().allow('', '0', '1'),
      })
    )
    @Query()
    query: Record<string, string>
  ): Promise<Resp> {
    const demoORM = new DemoORM();
    if (query.title !== '') {
      demoORM.title = query.title;
    }
    if (query.orm_status !== '') {
      demoORM.ormStatus = query.orm_status;
    }
    const data = await this.demoORMService.find(demoORM);
    return Resp.okData(data);
  }

  /**信息 */
  @Get('/:id')
  public async info(@Param('id') id: string): Promise<Resp> {
    const parsedId = parseNumber(id);
    if (parsedId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }

    const data = await this.demoORMService.findById(parsedId);
    if (data.id === parsedId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**新增 */
  @Post()
  public async add(@Body() body: DemoORM): Promise<Resp> {
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id not is empty');
    }
    const insertId = await this.demoORMService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**更新 */
  @Put()
  public async edit(@Body() body: DemoORM): Promise<Resp> {
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }
    const rowsAffected = await this.demoORMService.update(body);
    if (rowsAffected > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**删除 */
  @Del('/:id')
  public async remove(@Param('id') id: string): Promise<Resp> {
    if (id === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }

    const uniqueIDs = parseRemoveDuplicatesToArray(id, ',');
    const ids = uniqueIDs.map(item => parseNumber(item));
    const rowsAffected = await this.demoORMService.deleteByIds(ids);
    if (rowsAffected > 0) {
      return Resp.okMsg(`删除成功：${rowsAffected}`);
    }
    return Resp.err();
  }

  /**清空 */
  @Del('/clean')
  public async clean(): Promise<Resp> {
    const rows = await this.demoORMService.clean();
    return Resp.okData(rows);
  }
}
