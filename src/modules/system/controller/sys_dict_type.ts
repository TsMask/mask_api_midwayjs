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
import {
  OperateLogMiddleware,
  BUSINESS_TYPE,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { loginUserToUserName } from '../../../internal/web/reqctx/auth';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';
import { Resp } from '../../../internal/web/resp/api';
import { SysDictTypeService } from '../service/sys_dict_type';
import { SysDictType } from '../model/sys_dict_type';

/**字典类型信息 控制层处理 */
@Controller('/api/v1/system/dict/types')
export class SysDictTypeController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**字典类型服务 */
  @Inject()
  private sysDictTypeService: SysDictTypeService;

  /**字典类型列表 */
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysDictTypeService.findByPage(query);
    return Resp.okData({ rows: rows, total });
  }

  /**字典类型信息 */
  @Get('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:query'] }),
    ],
  })
  public async info(@Valid(Joi.number()) @Param('id') dictId: number) {
    if (dictId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: dictId is empty');
    }

    const data = await this.sysDictTypeService.findById(dictId);
    if (data.id === dictId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**字典类型新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:add'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysDictType): Promise<Resp> {
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: dictId not is empty');
    }
    // 检查字典名称唯一
    const uniqueName = await this.sysDictTypeService.checkUniqueByName(
      body.dict_name,
      0
    );
    if (!uniqueName) {
      return Resp.errMsg(`字典新增【${body.dict_name}】失败，字典名称已存在`);
    }

    // 检查字典类型唯一
    const uniqueType = await this.sysDictTypeService.checkUniqueByType(
      body.dict_type,
      0
    );
    if (!uniqueType) {
      return Resp.errMsg(`字典新增【${body.dict_name}】失败，字典类型已存在`);
    }

    body.create_by = loginUserToUserName(this.c);
    const insertId = await this.sysDictTypeService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**字典类型修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:edit'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysDictType): Promise<Resp> {
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: dictId is empty');
    }
    // 检查数据是否存在
    const dict_type = await this.sysDictTypeService.findById(body.id);
    if (dict_type.id !== body.id) {
      return Resp.errMsg('没有权限访问字典类型数据！');
    }

    // 检查字典名称唯一
    const uniqueName = await this.sysDictTypeService.checkUniqueByName(
      body.dict_name,
      body.id
    );
    if (!uniqueName) {
      return Resp.errMsg(`字典修改【${body.dict_name}】失败，字典名称已存在`);
    }

    // 检查字典类型唯一
    const uniqueType = await this.sysDictTypeService.checkUniqueByType(
      body.dict_type,
      body.id
    );
    if (!uniqueType) {
      return Resp.errMsg(`字典修改【${body.dict_name}】失败，字典类型已存在`);
    }

    dict_type.dict_name = body.dict_name;
    dict_type.dict_type = body.dict_type;
    dict_type.dict_status = body.dict_status;
    dict_type.remark = body.remark;
    dict_type.update_by = loginUserToUserName(this.c);
    const rows = await this.sysDictTypeService.update(dict_type);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**字典类型删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:remove'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.string().allow('')) @Param('id') dictId: string
  ): Promise<Resp> {
    if (dictId === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: dataId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(dictId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysDictTypeService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功：${rows}`);
  }

  /**字典类型刷新缓存 */
  @Put('/refresh', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:remove'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.OTHER,
      }),
    ],
  })
  public async refresh(): Promise<Resp> {
    await this.sysDictTypeService.cacheClean('*');
    await this.sysDictTypeService.cacheLoad('*');
    return Resp.ok();
  }

  /**字典类型选择框列表 */
  @Get('/options', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:query'] }),
    ],
  })
  public async options() {
    const data = await this.sysDictTypeService.find(new SysDictType());
    let arr: { label: string; value: string }[] = [];
    if (data.length <= 0) {
      return Resp.okData(arr);
    }
    // 数据组
    arr = data.map(item => ({
      label: item.dict_name,
      value: item.dict_type,
    }));
    return Resp.okData(arr);
  }

  /**字典类型列表导出 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:type:export'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    const [rows, total] = await this.sysDictTypeService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `dict_type_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysDictTypeService.exportData(rows, fileName);
  }
}
