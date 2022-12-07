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
import { parseNumber } from '../../../common/utils/ParseUtils';
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { SysConfig } from '../model/SysConfig';
import { SysConfigServiceImpl } from '../service/impl/SysConfigServiceImpl';

/**
 * 参数配置信息
 *
 * @author TsMask <340112800@qq.com>
 */
@Controller('/system/config')
export class SysConfigController {
  @Inject()
  private ctx: Context;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  /**
   * 获取参数配置列表
   * @returns 返回结果
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:config:list'] })
  async list(): Promise<Result> {
    const query = this.ctx.query;
    const data = await this.sysConfigService.selectConfigPage(query);
    return Result.ok(data);
  }

  /**
   * 导出参数配置列表
   */
  @Get('/export')
  @PreAuthorize({ hasPermissions: ['system:config:export'] })
  async export(@Body() sysConfig: SysConfig) {
    const list = await this.sysConfigService.selectConfigList(sysConfig);
    //   ExcelUtil<SysConfig> util = new ExcelUtil<SysConfig>(SysConfig.class);
    //   util.exportExcel(response, list, "参数数据");
    return list;
  }

  /**
   * 根据参数键名查询参数值
   * @param configKey 配置键key
   * @returns 返回结果
   */
  @Get('/configKey/:configKey')
  async getConfigKey(@Param('configKey') configKey: string): Promise<Result> {
    const key = await this.sysConfigService.selectConfigByKey(configKey);
    if (key) {
      return Result.okData(key);
    }
    return Result.err();
  }

  /**
   * 获取详细信息
   * @param configId 配置id
   * @returns 返回结果
   */
  @Get('/:configId')
  @PreAuthorize({ hasPermissions: ['system:config:query'] })
  async get(@Param('configId') configId: string): Promise<Result> {
    const id = parseNumber(configId);
    if (!id) return Result.err();
    const data = await this.sysConfigService.selectConfigById(id);
    return Result.okData(data || {});
  }

  /**
   * 新增参数配置
   * @param config 配置对象信息
   * @returns 返回结果
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:config:add'] })
  async add(@Body() config: SysConfig) {
    if (config && config.configKey) {
      const hasConfig = await this.sysConfigService.checkUniqueConfigKey(
        config.configKey
      );
      if (hasConfig) {
        return Result.errMsg(
          `新增参数 ${config.configKey} 失败，参数键名已存在`
        );
      }
      config.createBy = this.ctx.loginUser?.user?.userName;
      const id = await this.sysConfigService.insertConfig(config);
      return Result[id ? 'ok' : 'err']();
    }
    return Result.err();
  }

  /**
   * 修改参数配置
   * @param config 配置对象信息
   * @returns 返回结果
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:config:edit'] })
  async edit(@Body() config: SysConfig) {
    if (!config.configId) {
      return Result.err();
    }
    const hasConfig = await this.sysConfigService.checkUniqueConfigKey(
      config.configKey
    );
    if (hasConfig) {
      return Result.errMsg(
        `修改参数 ${config.configName} 失败，参数键名已存在`
      );
    }
    config.updateBy = this.ctx.loginUser?.user?.userName;
    const rowNum = await this.sysConfigService.updateConfig(config);
    return Result[rowNum ? 'ok' : 'err']();
  }

  /**
   * 删除参数配置
   * @param configIds 格式字符串 "id,id"
   * @returns 返回结果
   */
  @Del('/:configIds')
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  async remove(@Param('configIds') configIds: string) {
    if (!configIds) return Result.err();
    // 处理字符转有效数字id数组
    const ids = configIds
      .split(',')
      .map(s => parseNumber(s))
      .filter(i => i > 0);
    const rowNum = await this.sysConfigService.deleteConfigByIds(ids);
    return Result[rowNum ? 'ok' : 'err']();
  }

  /**
   * 刷新参数缓存
   * @returns 返回结果
   */
  @Del('/refreshCache')
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  async refreshCache(): Promise<Result> {
    await this.sysConfigService.resetConfigCache();
    return Result.ok();
  }
}
