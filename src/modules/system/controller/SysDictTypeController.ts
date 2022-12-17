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
import { SysDictType } from '../../../framework/core/model/SysDictType';
import { Result } from '../../../framework/core/Result';
import { OperLog } from '../../../framework/decorator/OperLogDecorator';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysDictTypeServiceImpl } from '../service/impl/SysDictTypeServiceImpl';

/**
 * 字典类型信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/dict/type')
export class SysDictTypeController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysDictTypeService: SysDictTypeServiceImpl;

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
  @Del('/refreshCache')
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
  @Get('/optionselect')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async optionselect() {
    const data = await this.sysDictTypeService.selectDictTypeList(
      new SysDictType()
    );
    return Result.okData(data || []);
  }
}
