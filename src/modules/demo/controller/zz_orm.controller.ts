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
import result from '../../../framework/result/result';
import { ContextService } from '../../../framework/service/ContextService';
import { ZzOrmService } from '../service/zz_orm.service';
import { ZzOrm } from '../model/zz_orm.entity';

/**
 * 演示-TypeORM基本使用
 *
 * 更多功能需要查阅 http://www.midwayjs.org/docs/extensions/orm
 * @author TsMask
 */
@Controller('/zzorm')
export class ZzOrmController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private zzOrmService: ZzOrmService;

  /**
   * 列表分页
   */
  @Get('/list')
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    if (!query.pageSize && !query.pageNum) {
      return result.errMsg('查询参数 pageSize、pageNum');
    }
    const data = await this.zzOrmService.selectPage(query);
    return result.ok(data);
  }

  /**
   * 列表无分页
   */
  @Get('/all')
  async all(@Query('title') title: string): Promise<Result> {
    const zzOrm = new ZzOrm();
    if (title) {
      zzOrm.title = title;
    }
    const data = await this.zzOrmService.selectList(zzOrm);
    return result.okData(data);
  }

  /**
   * 信息
   */
  @Get('/:id')
  async getInfo(@Param('id') id: string): Promise<Result> {
    if (!id) return result.err();
    const data = await this.zzOrmService.selectById(id);
    return result.okData(data);
  }

  /**
   * 新增
   */
  @Post()
  async add(@Body() zzOrm: ZzOrm): Promise<Result> {
    if (zzOrm.id || zzOrm.updateBy) return result.err();
    const data = await this.zzOrmService.insert(zzOrm);
    return result.okData(data);
  }

  /**
   * 更新
   */
  @Put()
  async update(@Body() zzOrm: ZzOrm): Promise<Result> {
    if (!zzOrm.id || !zzOrm.updateBy) return result.err();
    const data = await this.zzOrmService.update(zzOrm);
    return result.okData(data);
  }

  /**
   * 删除
   */
  @Del('/:ids')
  async remove(@Param('ids') ids: string): Promise<Result> {
    if (!ids) return result.err();
    // 处理字符转id数组后去重
    let idArr = ids.split(',');
    idArr = [...new Set(idArr)];
    if (idArr.length <= 0) {
      return result.err();
    }
    const rows = await this.zzOrmService.deleteByIds(idArr);
    return result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 清空
   */
  @Del('/clean')
  async clean(): Promise<Result> {
    const rows = await this.zzOrmService.clean();
    return result[rows > 0 ? 'ok' : 'err']();
  }
}
