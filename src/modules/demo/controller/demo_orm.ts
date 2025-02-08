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
  httpError,
} from '@midwayjs/core';
import { parseRemoveDuplicatesToArray } from '../../../framework/utils/parse/parse';
import { DemoORMService } from '../service/demo_orm';
import { DemoORM } from '../model/demo_orm';
import { Resp } from '../../../framework/resp/api';

/**
 * 演示-TypeORM基本使用
 *
 * 更多功能需要查阅 https://midwayjs.org/docs/extensions/orm
 * @author TsMask
 */
@Controller('/demo/orm')
export class DemoORMController {
  @Inject()
  private demoORMService: DemoORMService;

  /**
   * 列表分页
   */
  @Get('/list')
  async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.demoORMService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 列表无分页
   */
  @Get('/all')
  async all(
    @Query('title') title: string,
    @Query('statusFlag') statusFlag: string
  ): Promise<Resp> {
    const demoORM = new DemoORM();
    if (title !== '') {
      demoORM.title = title;
    }
    if (statusFlag != '') {
      demoORM.statusFlag = statusFlag;
    }
    const data = await this.demoORMService.find(demoORM);
    return Resp.okData(data);
  }

  /**
   * 信息
   */
  @Get('/:id')
  async info(@Param('id') id: number): Promise<Resp> {
    if (id <= 0) {
      throw new httpError.BadRequestError('bind err: id is empty');
    }
    const data = await this.demoORMService.findById(id);
    if (data.id === id) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**
   * 新增
   */
  @Post()
  async add(@Body() demoORM: DemoORM): Promise<Resp> {
    if (demoORM.id > 0) {
      throw new httpError.BadRequestError('bind err: id is not empty');
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
  async update(@Body() demoORM: DemoORM): Promise<Resp> {
    if (demoORM.id <= 0) {
      throw new httpError.BadRequestError('bind err: id is empty');
    }
    const rowsAffected = await this.demoORMService.update(demoORM);
    if (rowsAffected > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 删除
   */
  @Del('/:id')
  async remove(@Param('id') id: string): Promise<Resp> {
    const arr = parseRemoveDuplicatesToArray(id);
    if (id === '' || arr.length <= 0) {
      throw new httpError.BadRequestError('bind err: id is empty');
    }
    // 转换成Number数组类型
    const ids = arr.map(id => Number(id));
    const rowsAffected = await this.demoORMService.deleteByIds(ids);
    if (rowsAffected > 0) {
      return Resp.okMsg(`删除成功：${rowsAffected}`);
    }
    return Resp.err();
  }

  /**
   * 清空
   */
  @Del('/clean')
  async clean(): Promise<Resp> {
    const rows = await this.demoORMService.clean();
    return Resp.okData(rows);
  }
}
