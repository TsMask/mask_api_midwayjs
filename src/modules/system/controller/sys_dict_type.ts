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

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/ValueParseUtils';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysDictTypeService } from '../service/sys_dict_type';
import { SysDictType } from '../model/sys_dict_type';

/**字典类型信息 控制层处理 */
@Controller('/system/dict/type')
export class SysDictTypeController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysDictTypeService: SysDictTypeService;

  /**
   * 字典类型列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dict:list'] })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysDictTypeService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 字典类型信息
   */
  @Get('/:dictId')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  public async info(
    @Valid(RuleType.number().required()) @Param('dictId') dictId: number
  ) {
    if (dictId <= 0) {
      return Resp.codeMsg(40010, 'bind err: dictId is empty');
    }

    const data = await this.sysDictTypeService.findById(dictId);
    if (data.dictId === dictId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**
   * 字典类型新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dict:add'] })
  @OperateLog({
    title: '字典类型信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  public async add(@Body() body: SysDictType): Promise<Resp> {
    if (body.dictId > 0) {
      return Resp.codeMsg(40010, 'bind err: dictId not is empty');
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

    body.createBy = this.contextService.getUseName();
    const insertId = await this.sysDictTypeService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**
   * 字典类型修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dict:edit'] })
  @OperateLog({
    title: '字典类型信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async edit(@Body() body: SysDictType): Promise<Resp> {
    if (body.dictId <= 0) {
      return Resp.codeMsg(40010, 'bind err: dictId is empty');
    }

    // 检查数据是否存在
    const dictType = await this.sysDictTypeService.findById(body.dictId);
    if (!dictType) {
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
    dictType.updateBy = this.contextService.getUseName();
    const rows = await this.sysDictTypeService.update(dictType);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 字典类型删除
   */
  @Del('/:dictIds')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  @OperateLog({
    title: '字典类型信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  public async remove(
    @Valid(RuleType.string().required()) @Param('dictId') dictId: string
  ): Promise<Resp> {
    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(dictId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));
    const rows = await this.sysDictTypeService.deleteByIds(ids);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }

  /**
   * 字典类型刷新缓存
   */
  @Put('/refresh')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  @OperateLog({
    title: '字典类型信息',
    businessType: BUSINESS_TYPE.CLEAN,
  })
  public async refresh(): Promise<Resp> {
    await this.sysDictTypeService.cacheClean('*');
    await this.sysDictTypeService.cacheLoad('*');
    return Resp.ok();
  }

  /**
   * 字典类型选择框列表
   */
  @Get('/options')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
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

  /**
   * 字典类型列表导出
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:dict:export'] })
  @OperateLog({
    title: '字典类型信息',
    businessType: BUSINESS_TYPE.EXPORT,
  })
  public async export(@Query() query: Record<string, string>) {
    const [rows, total] = await this.sysDictTypeService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('导出数据记录为空');
    }

    // 导出文件名称
    const fileName = `dict_type_export_${rows.length}_${Date.now()}.xlsx`;
    const ctx = this.contextService.getContext();
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysDictTypeService.exportData(rows, fileName);
  }
}
