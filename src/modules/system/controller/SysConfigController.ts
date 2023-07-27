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
import { RepeatSubmit } from '../../../framework/decorator/RepeatSubmitMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { FileService } from '../../../framework/service/FileService';
import { SysConfig } from '../model/SysConfig';
import { SysConfigServiceImpl } from '../service/impl/SysConfigServiceImpl';

/**
 * 参数配置信息
 *
 * @author TsMask
 */
@Controller('/system/config')
export class SysConfigController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private fileService: FileService;

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
   * 参数配置信息
   */
  @Get('/:configId')
  @PreAuthorize({ hasPermissions: ['system:config:query'] })
  async getInfo(@Param('configId') configId: string): Promise<Result> {
    if (!configId) return Result.err();
    const data = await this.sysConfigService.selectConfigById(configId);
    return Result.okData(data);
  }

  /**
   * 参数配置新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:config:add'] })
  @OperLog({
    title: '参数配置信息',
    businessType: OperatorBusinessTypeEnum.INSERT,
  })
  async add(@Body() sysConfig: SysConfig) {
    const { configId, configName, configKey, configValue } = sysConfig;
    if (configId || !configName || !configKey || !configValue) {
      return Result.err();
    }

    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueConfigKey(
      configKey
    );
    if (!uniqueConfigKey) {
      return Result.errMsg(`参数配置新增【${configKey}】失败，参数键名已存在`);
    }

    sysConfig.createBy = this.contextService.getUseName();
    const insertId = await this.sysConfigService.insertConfig(sysConfig);
    return Result[insertId ? 'ok' : 'err']();
  }

  /**
   * 参数配置修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:config:edit'] })
  @OperLog({
    title: '参数配置信息',
    businessType: OperatorBusinessTypeEnum.UPDATE,
  })
  async edit(@Body() sysConfig: SysConfig) {
    const { configId, configName, configKey, configValue } = sysConfig;
    if (!configId || !configName || !configKey || !configValue) {
      return Result.err();
    }

    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueConfigKey(
      configKey,
      configId
    );
    if (!uniqueConfigKey) {
      return Result.errMsg(`参数配置修改【${configKey}】失败，参数键名已存在`);
    }

    // 检查是否存在
    const config = await this.sysConfigService.selectConfigById(configId);
    if (!config) {
      return Result.errMsg('没有权限访问参数配置数据！');
    }

    sysConfig.updateBy = this.contextService.getUseName();
    const rows = await this.sysConfigService.updateConfig(sysConfig);
    return Result[rows > 0 ? 'ok' : 'err']();
  }

  /**
   * 参数配置删除
   */
  @Del('/:configIds')
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  @OperLog({
    title: '参数配置信息',
    businessType: OperatorBusinessTypeEnum.DELETE,
  })
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
  @Put('/refreshCache')
  @RepeatSubmit()
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  @OperLog({
    title: '参数配置信息',
    businessType: OperatorBusinessTypeEnum.CLEAN,
  })
  async refreshCache(): Promise<Result> {
    await this.sysConfigService.resetConfigCache();
    return Result.ok();
  }

  /**
   * 参数配置根据参数键名
   */
  @Get('/configKey/:configKey')
  async getConfigKey(@Param('configKey') configKey: string): Promise<Result> {
    const data = await this.sysConfigService.selectConfigValueByKey(configKey);
    return Result.okData(data || '');
  }

  /**
   * 导出参数配置信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:config:export'] })
  @OperLog({
    title: '参数配置信息',
    businessType: OperatorBusinessTypeEnum.EXPORT,
  })
  async export() {
    const ctx = this.contextService.getContext();
    // 查询结果，根据查询条件结果，单页最大值限制
    const query: Record<string, any> = Object.assign({}, ctx.request.body);
    const data = await this.sysConfigService.selectConfigPage(query);
    // 导出数据组装
    const rows = data.rows.reduce(
      (pre: Record<string, string>[], cur: SysConfig) => {
        pre.push({
          参数编号: cur.configId,
          参数名称: cur.configName,
          参数键名: cur.configKey,
          参数键值: cur.configValue,
          系统内置: cur.configType === 'Y' ? '是' : '否',
        });
        return pre;
      },
      []
    );
    // 导出数据表格
    const fileName = `config_export_${rows.length}_${Date.now()}.xlsx`;
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.fileService.excelWriteRecord(
      rows,
      '参数配置信息',
      fileName
    );
  }
}
