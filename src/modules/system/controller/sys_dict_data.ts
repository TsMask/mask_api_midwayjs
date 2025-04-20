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
import { SysDictDataService } from '../service/sys_dict_data';
import { SysDictData } from '../model/sys_dict_data';

/**字典类型对应的字典数据信息 控制层处理 */
@Controller('/system/dict/data')
export class SysDictDataController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**字典数据服务 */
  @Inject()
  private sysDictDataService: SysDictDataService;

  /**字典类型服务 */
  @Inject()
  private sysDictTypeService: SysDictTypeService;

  /**字典数据列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dict:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysDictDataService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**字典数据详情 */
  @Get('/:dataId', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dict:query'] })],
  })
  public async info(
    @Valid(RuleType.number()) @Param('dataId') dataId: number
  ): Promise<Resp> {
    if (dataId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: deptId is empty');
    }
    const data = await this.sysDictDataService.findById(dataId);
    if (data.dataId === dataId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**字典数据新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:add'] }),
      OperateLogMiddleware({
        title: '字典数据信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysDictData): Promise<Resp> {
    if (body.dataId > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dataId not is empty');
    }

    // 检查字典类型是否存在
    const dictType = await this.sysDictTypeService.findByType(body.dictType);
    if (dictType.dictType !== body.dictType) {
      return Resp.errMsg('没有权限访问字典类型数据！');
    }

    // 检查字典标签唯一
    const uniqueLabel = await this.sysDictDataService.checkUniqueTypeByLabel(
      body.dictType,
      body.dataLabel,
      0
    );
    if (!uniqueLabel) {
      return Resp.errMsg(
        `数据新增【${body.dataLabel}】失败，该字典类型下标签名已存在`
      );
    }

    // 检查字典键值唯一
    const uniqueValue = await this.sysDictDataService.checkUniqueTypeByValue(
      body.dictType,
      body.dataValue,
      0
    );
    if (!uniqueValue) {
      return Resp.errMsg(
        `数据新增【${body.dataLabel}】失败，该字典类型下标签值已存在`
      );
    }

    body.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysDictDataService.insert(body);
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
        title: '字典数据信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysDictData): Promise<Resp> {
    if (body.dataId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dataId is empty');
    }

    // 检查字典类型是否存在
    const dictType = await this.sysDictTypeService.findByType(body.dictType);
    if (dictType.dictType !== body.dictType) {
      return Resp.errMsg('没有权限访问字典类型数据！');
    }

    // 检查字典编码是否存在
    const dictData = await this.sysDictDataService.findById(body.dataId);
    if (dictData.dataId !== body.dataId) {
      return Resp.errMsg('没有权限访问字典编码数据！');
    }

    // 检查字典标签唯一
    const uniqueLabel = await this.sysDictDataService.checkUniqueTypeByLabel(
      body.dictType,
      body.dataLabel,
      body.dataId
    );
    if (!uniqueLabel) {
      return Resp.errMsg(
        `数据修改【${body.dataLabel}】失败，该字典类型下标签名已存在`
      );
    }

    // 检查字典键值唯一
    const uniqueValue = await this.sysDictDataService.checkUniqueTypeByValue(
      body.dictType,
      body.dataLabel,
      body.dataId
    );
    if (!uniqueValue) {
      return Resp.errMsg(
        `数据修改【${body.dataLabel}】失败，该字典类型下标签值已存在`
      );
    }

    dictData.dictType = body.dictType;
    dictData.dataLabel = body.dataLabel;
    dictData.dataValue = body.dataValue;
    dictData.dataSort = body.dataSort;
    dictData.tagClass = body.tagClass;
    dictData.tagType = body.tagType;
    dictData.statusFlag = body.statusFlag;
    dictData.remark = body.remark;
    dictData.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysDictDataService.update(dictData);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**字典数据删除 */
  @Del('/:dataId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:remove'] }),
      OperateLogMiddleware({
        title: '字典数据信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.string().allow('')) @Param('dataId') dataId: string
  ): Promise<Resp> {
    if (dataId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dataId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(dataId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysDictDataService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }

  /**字典数据列表（指定字典类型） */
  @Get('/type/:dictType', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:dict:query'] })],
  })
  public async dictType(
    @Valid(RuleType.string().allow('')) @Param('dictType') dictType: string
  ): Promise<Resp> {
    if (dictType === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: dictType is empty');
    }
    const data = await this.sysDictDataService.findByType(dictType);
    return Resp.okData(data);
  }

  /**字典数据列表导出 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:dict:export'] }),
      OperateLogMiddleware({
        title: '字典数据信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    const [rows, total] = await this.sysDictDataService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `dict_data_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysDictDataService.exportData(rows, fileName);
  }
}
