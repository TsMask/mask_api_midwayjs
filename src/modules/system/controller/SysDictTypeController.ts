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
import { Context } from '@midwayjs/koa';
import { SysDictType } from '../../../framework/core/model/SysDictType';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SysDictTypeServiceImpl } from '../service/impl/SysDictTypeServiceImpl';

/**
 * 数据字典信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/dict/type')
export class SysDictTypeController {
  @Inject()
  private ctx: Context;

  @Inject()
  private sysDictTypeService: SysDictTypeServiceImpl;

  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dict:list'] })
  async list(): Promise<Result> {
    const query = this.ctx.query;
    const data = await this.sysDictTypeService.selectDictTypePage(query);
    return Result.ok(data);
  }

  // @Log(title = "字典类型", businessType = BusinessType.EXPORT)
  // @PreAuthorize("@ss.hasPermi('system:dict:export')")
  // @PostMapping("/export")
  // public void export(HttpServletResponse response, SysDictType dictType)
  // {
  //     List<SysDictType> list = dictTypeService.selectDictTypeList(dictType);
  //     ExcelUtil<SysDictType> util = new ExcelUtil<SysDictType>(SysDictType.class);
  //     util.exportExcel(response, list, "字典类型");
  // }

  /**
   * 查询字典类型详细
   */
  @Get('/:dictId')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async getInfo(@Param('dictId') dictId: string) {
    const data = await this.sysDictTypeService.selectDictTypeById(dictId);
    return Result.okData(data);
  }

  /**
   * 新增字典类型
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dict:add'] })
  async add(@Body() sysDictType: SysDictType): Promise<Result> {
    const dictType = await this.sysDictTypeService.selectDictTypeByType(
      sysDictType.dictType
    );
    if (!dictType) {
      sysDictType.createBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysDictTypeService.insertDictType(sysDictType);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.errMsg(
      `新增字典【${sysDictType.dictType}】失败，字典类型已存在`
    );
  }

  /**
   * 修改字典类型
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dict:edit'] })
  async edit(@Body() sysDictType: SysDictType): Promise<Result> {
    const dictType = await this.sysDictTypeService.selectDictTypeByType(
      sysDictType.dictType
    );
    if (dictType) {
      sysDictType.updateBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysDictTypeService.updateDictType(sysDictType);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.errMsg(
      `修改字典【${sysDictType.dictType}】失败，字典类型不存在`
    );
  }

  /**
   * 删除字典类型
   */
  @Del('/:dictIds')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  async remove(@Param('dictIds') dictIds: string): Promise<Result> {
    if (!dictIds) return Result.err();
    // 处理字符转id数组
    const ids = dictIds.split(',');
    const rowNum = await this.sysDictTypeService.deleteDictTypeByIds(ids);
    return Result[rowNum ? 'ok' : 'err']();
  }

  /**
   * 刷新字典缓存
   */
  @Del('/refreshCache')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  async refreshCache(): Promise<Result> {
    await this.sysDictTypeService.resetDictCache();
    return Result.ok();
  }

  /**
   * 获取字典选择框列表
   */
  @Get('/optionselect')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async optionselect() {
    const data = await this.sysDictTypeService.selectDictTypeList(
      new SysDictType()
    );
    return Result.okData(data);
  }
}
