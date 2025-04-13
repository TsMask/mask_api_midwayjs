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
import { Context } from '@midwayjs/koa';

import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import { Resp } from '../../../framework/resp/api';
import { DemoORMService } from '../service/demo_orm';
import { DemoORM } from '../model/demo_orm';

/**
 * 演示-TypeORM基本使用
 *
 * 更多功能需要查阅 https://midwayjs.org/docs/extensions/orm
 */
@Controller('/demo/orm')
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
    @Query('title') title: string,
    @Query('statusFlag') statusFlag: string
  ): Promise<Resp> {
    const demoORM = new DemoORM();
    if (title !== '') {
      demoORM.title = title;
    }
    if (statusFlag !== '') {
      demoORM.statusFlag = statusFlag;
    }
    const data = await this.demoORMService.find(demoORM);
    return Resp.okData(data);
  }

  /**信息 */
  @Get('/:id')
  async info(@Param('id') id: number): Promise<Resp> {
    if (id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422001, 'bind err: id is empty');
    }

    const data = await this.demoORMService.findById(id);
    if (data.id === id) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**新增 */
  @Post()
  public async add(@Body() demoORM: DemoORM): Promise<Resp> {
    if (demoORM.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: id not is empty');
    }
    const insertId = await this.demoORMService.insert(demoORM);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**
   * 更新
   */
  @Put()
  public async update(@Body() demoORM: DemoORM): Promise<Resp> {
    if (demoORM.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: id is empty');
    }
    const rowsAffected = await this.demoORMService.update(demoORM);
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
      return Resp.codeMsg(422002, 'bind err: id is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(id, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

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
