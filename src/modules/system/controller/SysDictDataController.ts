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
import { SysDictData } from '../../../framework/core/model/SysDictData';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SysDictDataServiceImpl } from '../service/impl/SysDictDataServiceImpl';

/**
 * 字典类型对应数据信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/dict/data')
export class SysDictDataController {
  @Inject()
  private ctx: Context;

  @Inject()
  private sysDictDataServer: SysDictDataServiceImpl;

  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:dict:list'] })
  async list(): Promise<Result> {
    const query = this.ctx.query;
    const data = await this.sysDictDataServer.selectDictDataPage(query);
    return Result.ok(data);
  }

  // @Log(title = "字典数据", businessType = BusinessType.EXPORT)
  // @PreAuthorize("@ss.hasPermi('system:dict:export')")
  // @PostMapping("/export")
  // public void export(HttpServletResponse response, SysDictData dictData)
  // {
  //     List<SysDictData> list = dictDataService.selectDictDataList(dictData);
  //     ExcelUtil<SysDictData> util = new ExcelUtil<SysDictData>(SysDictData.class);
  //     util.exportExcel(response, list, "字典数据");
  // }

  /**
   * 查询字典数据详细
   */
  @Get('/:dictCode')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async getInfo(@Param('dictCode') dictCode: string): Promise<Result> {
    const data = await this.sysDictDataServer.selectDictDataById(dictCode);
    return Result.okData(data || {});
  }

  /**
   * 根据字典类型查询字典数据信息
   */
  @Get('/type/:dictType')
  @PreAuthorize({ hasPermissions: ['system:dict:query'] })
  async dictType(@Param('dictType') dictType: string): Promise<Result> {
    const sysDictData = new SysDictData();
    sysDictData.status = '0';
    sysDictData.dictType = dictType;
    const data = await this.sysDictDataServer.selectDictDataList(sysDictData);
    return Result.okData(data);
  }

  /**
   * 新增字典类型数据
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:dict:add'] })
  async add(@Body() sysDictData: SysDictData): Promise<Result> {
    if (sysDictData && sysDictData.dictType) {
      sysDictData.createBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysDictDataServer.insertDictData(sysDictData);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.err();
  }

  /**
   * 修改保存字典类型数据
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:dict:edit'] })
  async edit(@Body() sysDictData: SysDictData): Promise<Result> {
    if (sysDictData && sysDictData.dictCode) {
      sysDictData.updateBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysDictDataServer.updateDictData(sysDictData);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.err();
  }

  /**
   * 删除字典类型数据
   */
  @Del('/:dictCodes')
  @PreAuthorize({ hasPermissions: ['system:dict:remove'] })
  async remove(@Param('dictCodes') dictCodes: string): Promise<Result> {
    if (!dictCodes) return Result.err();
    // 处理字符转id数组
    const ids = dictCodes.split(',');
    const rowNum = await this.sysDictDataServer.deleteDictDataByIds(ids);
    return Result[rowNum ? 'ok' : 'err']();
  }
}
