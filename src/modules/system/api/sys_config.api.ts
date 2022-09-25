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
import { parse_number } from '../../../common/utils/parse.utils';
import { PageBody } from '../../../framework/core/page_body';
import { PageData } from '../../../framework/core/page_data';
import { Result } from '../../../framework/core/result';
import { SysConfig } from '../model/sys_config';
import { SysConfigService } from '../service/sys_config.service';

/**
 * 参数配置信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/config')
export class SysConfigApi {
  @Inject()
  private ctx: Context;

  @Inject()
  private sys_config_service: SysConfigService;

  /**
   * 获取参数配置列表
   */
  @Get('/list')
  async list(@Body() param: PageBody<SysConfig>): Promise<PageData<SysConfig>> {
    return await this.sys_config_service.select_config_page(param);
  }

  /**
   * 导出参数配置列表
   */
  @Get('/export')
  async export(@Body() config: SysConfig) {
    const list = await this.sys_config_service.select_config_list(config);
    //   ExcelUtil<SysConfig> util = new ExcelUtil<SysConfig>(SysConfig.class);
    //   util.exportExcel(response, list, "参数数据");
    return list;
  }

  /**
   * 根据参数编号获取详细信息
   */
  @Get('/:configId')
  async get_info(@Param('configId') config_id: number): Promise<Result> {
    if (parse_number(config_id)) {
      const data = await this.sys_config_service.select_config_by_id(config_id);
      return Result.ok_data(data);
    }
    return Result.err();
  }

  /**
   * 根据参数键名查询参数值
   */
  @Get('/configKey/:configKey')
  async get_config_key(
    @Param('configKey') config_key: string
  ): Promise<Result> {
    const key = await this.sys_config_service.select_config_by_key(config_key);
    return Result.ok_data(key);
  }

  /**
   * 新增参数配置
   */
  @Post()
  async add(@Body() config: SysConfig) {
    const hasConfig = this.sys_config_service.check_unique_config_key(
      config.config_key
    );
    if (hasConfig) {
      return Result.err_msg(
        `新增参数 ${config.config_key} 失败，参数键名已存在`
      );
    }
    config.create_by = this.ctx.username;
    const row = await this.sys_config_service.insert_config(config);
    return Result[row > 0 ? 'ok' : 'err']();
  }

  /**
   * 修改参数配置
   */
  @Put()
  async edit(@Body() config: SysConfig) {
    const hasConfig = this.sys_config_service.check_unique_config_key(
      config.config_key
    );
    if (hasConfig) {
      return Result.err_msg(
        `修改参数 ${config.config_name} 失败，参数键名已存在`
      );
    }
    config.update_by = this.ctx.username;
    const row = await this.sys_config_service.update_config(config);
    return Result[row > 0 ? 'ok' : 'err']();
  }

  /**
   * 删除参数配置
   */
  @Del('/:configIds')
  async remove(@Param('configIds') config_ids: number[]) {
    const rows = await this.sys_config_service.delete_config_by_ids(config_ids);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 刷新参数缓存
   */
  @Del('/refreshCache')
  async refresh_cache() {
    await this.sys_config_service.reset_config_cache();
    return Result.ok();
  }
}
