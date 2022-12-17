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
import { OperatorBusinessTypeEnum } from '../../../common/enums/OperatorBusinessTypeEnum';
import { SysDictData } from '../../../framework/core/model/SysDictData';
import { Result } from '../../../framework/core/Result';
import { OperLog } from '../../../framework/decorator/OperLogDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysDictDataServiceImpl } from '../service/impl/SysDictDataServiceImpl';

/**
 * 字典类型对应的字典数据信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/dict/data')
export class SysDictDataController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysDictDataServer: SysDictDataServiceImpl;

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
   * 字典数据信息
   */
  @Get('/:dictCode')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async getInfo(@Param('dictCode') dictCode: string): Promise<Result> {
    const data = await this.sysDictDataServer.selectDictDataById(dictCode);
    return Result.okData(data || {});
  }

  /**
   * 字典数据列表根据字典类型
   */
  @Get('/type/:dictType')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async dictType(@Param('dictType') dictType: string): Promise<Result> {
    const sysDictData = new SysDictData();
    sysDictData.status = '0';
    sysDictData.dictType = dictType;
    const data = await this.sysDictDataServer.selectDictDataList(sysDictData);
    return Result.okData(data || []);
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
    if (
      !sysDictData.dictType ||
      !sysDictData.dictLabel ||
      !sysDictData.dictValue
    )
      return Result.err();
    // 检查属性值唯一
    const uniqueDictLabel = await this.sysDictDataServer.checkUniqueDictLabel(
      sysDictData
    );
    if (!uniqueDictLabel) {
      return Result.errMsg(
        `数据新增【${sysDictData.dictLabel}】失败，该字典类型下标签已存在`
      );
    }
    const uniqueDictValue = await this.sysDictDataServer.checkUniqueDictValue(
      sysDictData
    );
    if (!uniqueDictValue) {
      return Result.errMsg(
        `数据新增【${sysDictData.dictValue}】失败，该字典类型下键值已存在`
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
    if (
      !sysDictData.dictType ||
      !sysDictData.dictLabel ||
      !sysDictData.dictValue
    )
      return Result.err();
    // 检查属性值唯一
    const uniqueDictLabel = await this.sysDictDataServer.checkUniqueDictLabel(
      sysDictData
    );
    if (!uniqueDictLabel) {
      return Result.errMsg(
        `数据修改【${sysDictData.dictLabel}】失败，该字典类型下标签已存在`
      );
    }
    const uniqueDictValue = await this.sysDictDataServer.checkUniqueDictValue(
      sysDictData
    );
    if (!uniqueDictValue) {
      return Result.errMsg(
        `数据修改【${sysDictData.dictValue}】失败，该字典类型下键值已存在`
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
    const rows = await this.sysDictDataServer.deleteDictDataByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }
}
