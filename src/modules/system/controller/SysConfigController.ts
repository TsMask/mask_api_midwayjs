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
import { Result } from '../../../framework/core/Result';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeDecorator';
import { ContextService } from '../../../framework/service/ContextService';
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
  private contextService: ContextService;

  @Inject()
  private sysConfigService: SysConfigServiceImpl;

  /**
   * 参数配置列表
   * @returns 返回结果
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:config:list'] })
  async list(): Promise<Result> {
    const query = this.contextService.getContext().query;
    const data = await this.sysConfigService.selectConfigPage(query);
    return Result.ok(data);
  }

  /**
   * 参数配置根据参数键名
   */
  @Get('/configKey/:configKey')
  async getConfigKey(@Param('configKey') configKey: string): Promise<Result> {
    const key = await this.sysConfigService.selectConfigValueByKey(configKey);
    return Result.okData(key || '');
  }

  /**
   * 参数配置信息
   */
  @Get('/:configId')
  @PreAuthorize({ hasPermissions: ['system:config:query'] })
  async get(@Param('configId') configId: string): Promise<Result> {
    if (!configId) return Result.err();
    const data = await this.sysConfigService.selectConfigById(configId);
    return Result.okData(data || {});
  }

  /**
   * 参数配置新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:config:add'] })
  async add(@Body() sysConfig: SysConfig) {
    if (!sysConfig.configName || !sysConfig.configKey || !sysConfig.configValue)
      return Result.err();
    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueConfigKey(
      sysConfig
    );
    if (!uniqueConfigKey) {
      return Result.errMsg(
        `参数配置新增【${sysConfig.configKey}】失败，参数键名已存在`
      );
    }
    const uniqueConfigValue =
      await this.sysConfigService.checkUniqueConfigValue(sysConfig);
    if (!uniqueConfigValue) {
      return Result.errMsg(
        `参数配置新增【${sysConfig.configValue}】失败，参数键值已存在`
      );
    }

    sysConfig.createBy = this.contextService.getUsername();
    const insertId = await this.sysConfigService.insertConfig(sysConfig);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 参数配置修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:config:edit'] })
  async edit(@Body() sysConfig: SysConfig) {
    if (!sysConfig.configName || !sysConfig.configKey || !sysConfig.configValue)
      return Result.err();
    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueConfigKey(
      sysConfig
    );
    if (!uniqueConfigKey) {
      return Result.errMsg(
        `参数配置修改【${sysConfig.configKey}】失败，参数键名已存在`
      );
    }
    const uniqueConfigValue =
      await this.sysConfigService.checkUniqueConfigValue(sysConfig);
    if (!uniqueConfigValue) {
      return Result.errMsg(
        `参数配置修改【${sysConfig.configValue}】失败，参数键值已存在`
      );
    }
    // 检查是否存在
    const config = await this.sysConfigService.selectConfigById(
      sysConfig.configId
    );
    if (!config) {
      return Result.errMsg('没有权限访问参数配置数据！');
    }
    sysConfig.updateBy = this.contextService.getUsername();
    const rows = await this.sysConfigService.updateConfig(sysConfig);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 参数配置删除
   */
  @Del('/:configIds')
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  async remove(@Param('configIds') configIds: string) {
    if (!configIds) return Result.err();
    // 处理字符转有效数字id数组
    const ids = configIds.split(',');
    if (ids.length <= 0) return Result.err();
    const rows = await this.sysConfigService.deleteConfigByIds([
      ...new Set(ids),
    ]);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 参数配置刷新缓存
   */
  @Del('/refreshCache')
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  async refreshCache(): Promise<Result> {
    await this.sysConfigService.resetConfigCache();
    return Result.ok();
  }
}
