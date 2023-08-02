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
import { Result } from '../../../framework/vo/Result';
import { OperLog } from '../../../framework/decorator/OperLogMethodDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysDictDataServiceImpl } from '../service/impl/SysDictDataServiceImpl';
import { SysDictData } from '../model/SysDictData';
import { SysDictTypeServiceImpl } from '../service/impl/SysDictTypeServiceImpl';

/**
 * 字典类型对应的字典数据信息
 *
 * @author TsMask
 */
@Controller('/system/dict/data')
export class SysDictDataController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

  @Inject()
  private sysDictDataServer: SysDictDataServiceImpl;

  @Inject()
  private sysDictTypeService: SysDictTypeServiceImpl;

  /**
   * 字典数据列表
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dict:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysDictDataServer.selectDictDataPage(query);
    return Result.ok(data);
  }

  /**
   * 字典数据详情
   */
  @Get('/:dictCode')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async getInfo(@Param('dictCode') dictCode: string): Promise<Result> {
    const data = await this.sysDictDataServer.selectDictDataByCode(dictCode);
    return Result.okData(data);
  }

  /**
   * 字典数据新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dict:add'] })
  @OperLog({
    title: '字典数据信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() sysDictData: SysDictData): Promise<Result> {
    const { dictCode, dictType, dictLabel, dictValue } = sysDictData;
    if (dictCode || !dictType || !dictLabel || !dictValue) return Result.err();
    // 检查字典类型是否存在
    const dict = await this.sysDictTypeService.selectDictTypeByType(dictType);
    if (!dict) {
      return Result.errMsg('没有权限访问字典类型数据！');
    }

    // 检查字典标签唯一
    const uniqueDictLabel = await this.sysDictDataServer.checkUniqueDictLabel(
      dictType,
      dictLabel
    );
    if (!uniqueDictLabel) {
      return Result.errMsg(
        `数据新增【${dictLabel}】失败，该字典类型下标签名已存在`
      );
    }

    // 检查字典键值唯一
    const uniqueDictValue = await this.sysDictDataServer.checkUniqueDictValue(
      dictType,
      dictValue
    );
    if (!uniqueDictValue) {
      return Result.errMsg(
        `数据新增【${dictValue}】失败，该字典类型下标签值已存在`
      );
    }

    sysDictData.createBy = this.contextService.getUseName();
    const insertId = await this.sysDictDataServer.insertDictData(sysDictData);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 字典数据修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dict:edit'] })
  @OperLog({
    title: '字典数据信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() sysDictData: SysDictData): Promise<Result> {
    const { dictCode, dictType, dictLabel, dictValue } = sysDictData;
    if (!dictCode || !dictType || !dictLabel || !dictValue) return Result.err();

    // 检查字典类型是否存在
    const dict = await this.sysDictTypeService.selectDictTypeByType(dictType);
    if (!dict) {
      return Result.errMsg('没有权限访问字典类型数据！');
    }

    // 检查字典编码是否存在
    const dictData = await this.sysDictDataServer.selectDictDataByCode(
      dictCode
    );
    if (!dictData) {
      return Result.errMsg('没有权限访问字典编码数据！');
    }

    // 检查字典标签唯一
    const uniqueDictLabel = await this.sysDictDataServer.checkUniqueDictLabel(
      dictType,
      dictLabel,
      dictCode
    );
    if (!uniqueDictLabel) {
      return Result.errMsg(
        `数据修改【${dictLabel}】失败，该字典类型下标签名已存在`
      );
    }

    // 检查字典键值唯一
    const uniqueDictValue = await this.sysDictDataServer.checkUniqueDictValue(
      dictType,
      dictValue,
      dictCode
    );
    if (!uniqueDictValue) {
      return Result.errMsg(
        `数据修改【${dictValue}】失败，该字典类型下标签值已存在`
      );
    }

    sysDictData.updateBy = this.contextService.getUseName();
    const id = await this.sysDictDataServer.updateDictData(sysDictData);
    return Result[id ? 'ok' : 'err']();
  }

  /**
   * 字典数据删除
   */
  @Del('/:dictCodes')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  @OperLog({
    title: '字典数据信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
  async remove(@Param('dictCodes') dictCodes: string): Promise<Result> {
    if (!dictCodes) return Result.err();
    // 处理字符转id数组
    const ids = dictCodes.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysDictDataServer.deleteDictDataByCodes([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 字典数据列表（指定字典类型）
   */
  @Get('/type/:dictType')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async getDictType(@Param('dictType') dictType: string): Promise<Result> {
    const data = await this.sysDictDataServer.selectDictDataByType(dictType);
    return Result.okData(data || []);
  }

  /**
   * 字典数据列表导出
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:dict:export'] })
  @OperLog({
    title: '字典数据信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysDictDataServer.selectDictDataPage(query);
    if (data.total === 0) {
      return Result.errMsg('导出数据记录为空');
    }
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysDictData) => {
        pre.push({
          字典编码: cur.dictCode,
          字典排序: `${cur.dictSort}`,
          字典标签: cur.dictLabel,
          字典键值: cur.dictValue,
          字典类型: cur.dictType,
          状态: ['停用', '正常'][+cur.status],
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `dict_data_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.excelWriteRecord(rows, fileName);
  }
}
