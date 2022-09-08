import { Controller, Get, Inject, Param } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { SysDictDataService } from '../service/sys_dict_data.service';
import { R, R_Ok_DATA } from '../../../common/core/r';

/**
 * 数据字典信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/dict/data')
export class SysDictDataApi {
  @Inject()
  ctx: Context;

  @Inject()
  sys_dict_data_server: SysDictDataService;

  // @PreAuthorize("@ss.hasPermi('system:dict:list')")
  // @GetMapping("/list")
  // public TableDataInfo list(SysDictData dictData)
  // {
  //     startPage();
  //     List<SysDictData> list = dictDataService.selectDictDataList(dictData);
  //     return getDataTable(list);
  // }

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
  async get_info(@Param('dictCode') dict_code: string): Promise<R> {
    const data = await this.sys_dict_data_server.select_dict_data_by_id(
      dict_code
    );
    return R_Ok_DATA(data);
  }
  // // @PreAuthorize("@ss.hasPermi('system:dict:query')")
  // @GetMapping(value = "/{dictCode}")
  // public AjaxResult getInfo(@PathVariable Long dictCode)
  // {
  //     return AjaxResult.success(dictDataService.selectDictDataById(dictCode));
  // }

  // /**
  //  * 根据字典类型查询字典数据信息
  //  */
  // @GetMapping(value = "/type/{dictType}")
  // public AjaxResult dictType(@PathVariable String dictType)
  // {
  //     List<SysDictData> data = dictTypeService.selectDictDataByType(dictType);
  //     if (StringUtils.isNull(data))
  //     {
  //         data = new ArrayList<SysDictData>();
  //     }
  //     return AjaxResult.success(data);
  // }

  // /**
  //  * 新增字典类型
  //  */
  // @PreAuthorize("@ss.hasPermi('system:dict:add')")
  // @Log(title = "字典数据", businessType = BusinessType.INSERT)
  // @PostMapping
  // public AjaxResult add(@Validated @RequestBody SysDictData dict)
  // {
  //     dict.setCreateBy(getUsername());
  //     return toAjax(dictDataService.insertDictData(dict));
  // }

  // /**
  //  * 修改保存字典类型
  //  */
  // @PreAuthorize("@ss.hasPermi('system:dict:edit')")
  // @Log(title = "字典数据", businessType = BusinessType.UPDATE)
  // @PutMapping
  // public AjaxResult edit(@Validated @RequestBody SysDictData dict)
  // {
  //     dict.setUpdateBy(getUsername());
  //     return toAjax(dictDataService.updateDictData(dict));
  // }

  // /**
  //  * 删除字典类型
  //  */
  // @PreAuthorize("@ss.hasPermi('system:dict:remove')")
  // @Log(title = "字典类型", businessType = BusinessType.DELETE)
  // @DeleteMapping("/{dictCodes}")
  // public AjaxResult remove(@PathVariable Long[] dictCodes)
  // {
  //     dictDataService.deleteDictDataByIds(dictCodes);
  //     return success();
  // }
}
