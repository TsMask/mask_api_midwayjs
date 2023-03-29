import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@midwayjs/decorator';
import { OperatorBusinessTypeEnum } from '../../../framework/enums/OperatorBusinessTypeEnum';
import { Result } from '../../../framework/model/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysDictTypeServiceImpl } from '../service/impl/SysDictTypeServiceImpl';
import { SysDictType } from '../model/SysDictType';
import { STATUS_YES } from '../../../framework/constants/CommonConstants';

/**
 * 字典类型信息
 *
 * @author TsMask
 */
@Controller('/system/dict/type')
export class SysDictTypeController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysDictTypeService: SysDictTypeServiceImpl;

  /**
   * 导出字典类型信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:dict:export'] })
  @OperLog({
    title: '字典类型信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    query.pageNum = 1;
    query.pageSize = 1000;
    const data = await this.sysDictTypeService.selectDictTypePage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysDictType) => {
        pre.push({
          字典主键: cur.dictId,
          字典名称: cur.dictName,
          字典类型: cur.dictType,
          状态: cur.status === STATUS_YES ? '正常' : '停用',
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `dict_type_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.writeExcelFile(
      rows,
      '字典类型信息',
      fileName
    );
  }

  /**
   * 字典类型列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dict:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysDictTypeService.selectDictTypePage(query);
    return Result.ok(data);
  }

  /**
   * 字典类型信息
   */
  @Get('/:dictId')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async getInfo(@Param('dictId') dictId: string) {
    const data = await this.sysDictTypeService.selectDictTypeById(dictId);
    return Result.okData(data || {});
  }

  /**
   * 字典类型新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dict:add'] })
  @OperLog({
    title: '字典类型信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() sysDictType: SysDictType): Promise<Result> {
    // 检查属性值唯一
    const uniqueDictName = await this.sysDictTypeService.checkUniqueDictName(
      sysDictType
    );
    if (!uniqueDictName) {
      return Result.errMsg(
        `字典新增【${sysDictType.dictName}】失败，字典名称已存在`
      );
    }
    const uniqueDictType = await this.sysDictTypeService.checkUniqueDictType(
      sysDictType
    );
    if (!uniqueDictType) {
      return Result.errMsg(
        `字典新增【${sysDictType.dictType}】失败，字典类型已存在`
      );
    }

    sysDictType.createBy = this.contextService.getUseName();
    const insertId = await this.sysDictTypeService.insertDictType(sysDictType);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 字典类型修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dict:edit'] })
  @OperLog({
    title: '字典类型信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() sysDictType: SysDictType): Promise<Result> {
    // 检查属性值唯一
    const uniqueDictName = await this.sysDictTypeService.checkUniqueDictName(
      sysDictType
    );
    if (!uniqueDictName) {
      return Result.errMsg(
        `字典修改【${sysDictType.dictName}】失败，字典名称已存在`
      );
    }
    const uniqueDictType = await this.sysDictTypeService.checkUniqueDictType(
      sysDictType
    );
    if (!uniqueDictType) {
      return Result.errMsg(
        `字典修改【${sysDictType.dictType}】失败，字典类型已存在`
      );
    }
    sysDictType.updateBy = this.contextService.getUseName();
    const rows = await this.sysDictTypeService.updateDictType(sysDictType);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 字典类型删除
   */
  @Del('/:dictIds')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  @OperLog({
    title: '字典类型信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('dictIds') dictIds: string): Promise<Result> {
    if (!dictIds) return Result.err();
    // 处理字符转id数组
    const ids = dictIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysDictTypeService.deleteDictTypeByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 字典类型刷新缓存
   */
  @Put('/refreshCache')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  @OperLog({
    title: '字典类型信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async refreshCache(): Promise<Result> {
    await this.sysDictTypeService.resetDictCache();
    return Result.ok();
  }

  /**
   * 字典类型选择框列表
   */
  @Get('/getDictOptionselect')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async getDictOptionselect() {
    const data = await this.sysDictTypeService.selectDictTypeList(
      new SysDictType()
    );
    let labelValueObj: { label: string; value: any }[] = [];
    if (data && data.length > 0) {
      labelValueObj = data.map(item => ({
        label: item.dictName,
        value: item.dictType,
      }));
    }
    return Result.okData(labelValueObj);
  }
}
