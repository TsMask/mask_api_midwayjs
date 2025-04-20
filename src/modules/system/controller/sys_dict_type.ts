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
import { RuleType, Valid } from '@midwayjs/validate';
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
import { Resp } from '../../../framework/resp/api';
import { SysDictTypeService } from '../service/sys_dict_type';
import { SysDictType } from '../model/sys_dict_type';

/**字典类型信息 控制层处理 */
@Controller('/system/dict/type')
export class SysDictTypeController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**字典类型服务 */
  @Inject()
  private sysDictTypeService: SysDictTypeService;

  /**字典类型列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dict:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysDictTypeService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**字典类型信息 */
  @Get('/:dictId', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dict:query'] })],
  })
  public async info(@Valid(RuleType.number()) @Param('dictId') dictId: number) {
    if (dictId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dictId is empty');
    }

    const data = await this.sysDictTypeService.findById(dictId);
    if (data.dictId === dictId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**字典类型新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:add'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysDictType): Promise<Resp> {
    if (body.dictId > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dictId not is empty');
    }

    // 检查字典名称唯一
    const uniqueName = await this.sysDictTypeService.checkUniqueByName(
      body.dictName,
      0
    );
    if (!uniqueName) {
      return Resp.errMsg(`字典新增【${body.dictName}】失败，字典名称已存在`);
    }

    // 检查字典类型唯一
    const uniqueType = await this.sysDictTypeService.checkUniqueByType(
      body.dictType,
      0
    );
    if (!uniqueType) {
      return Resp.errMsg(`字典新增【${body.dictName}】失败，字典类型已存在`);
    }

    body.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysDictTypeService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**字典类型修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:edit'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysDictType): Promise<Resp> {
    if (body.dictId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dictId is empty');
    }

    // 检查数据是否存在
    const dictType = await this.sysDictTypeService.findById(body.dictId);
    if (dictType.dictId !== body.dictId) {
      return Resp.errMsg('没有权限访问字典类型数据！');
    }

    // 检查字典名称唯一
    const uniqueName = await this.sysDictTypeService.checkUniqueByName(
      body.dictName,
      body.dictId
    );
    if (!uniqueName) {
      return Resp.errMsg(`字典修改【${body.dictName}】失败，字典名称已存在`);
    }

    // 检查字典类型唯一
    const uniqueType = await this.sysDictTypeService.checkUniqueByType(
      body.dictType,
      body.dictId
    );
    if (!uniqueType) {
      return Resp.errMsg(`字典修改【${dictType}】失败，字典类型已存在`);
    }

    dictType.dictName = body.dictName;
    dictType.dictType = body.dictType;
    dictType.statusFlag = body.statusFlag;
    dictType.remark = body.remark;
    dictType.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysDictTypeService.update(dictType);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**字典类型删除 */
  @Del('/:dictId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:remove'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.string().allow('')) @Param('dictId') dictId: string
  ): Promise<Resp> {
    if (dictId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dataId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(dictId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysDictTypeService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }

  /**字典类型刷新缓存 */
  @Put('/refresh', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:remove'] }),
      OperateLogMiddleware({
        title: '字典类型信息',
        businessType: BUSINESS_TYPE.CLEAN,
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
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dict:query'] })],
  })
  public async options() {
    const data = await this.sysDictTypeService.find(new SysDictType());
    let arr: { label: string; value: string }[] = [];
    if (data.length <= 0) {
      return Resp.okData(arr);
    }
    // 数据组
    arr = data.map(item => ({
      label: item.dictName,
      value: item.dictType,
    }));
    return Resp.okData(arr);
  }

  /**字典类型列表导出 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:export'] }),
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
    const fileName = `dict_type_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysDictTypeService.exportData(rows, fileName);
  }
}
