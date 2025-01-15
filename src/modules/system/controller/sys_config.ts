import {
  Body,
  Controller,
  Del,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
} from '@midwayjs/core';

import {
  BUSINESS_TYPE,
  OperateLog,
} from '../../../framework/decorator/OperateLogMethodDecorator';
import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/ValueParseUtils';
import { Resp } from '../../../framework/resp/api';
import { PreAuthorize } from '../../../framework/decorator/PreAuthorizeMethodDecorator';
import { RepeatSubmit } from '../../../framework/decorator/RepeatSubmitMethodDecorator';
import { ContextService } from '../../../framework/service/ContextService';
import { SysConfigService } from '../service/sys_config';
import { RuleType, Valid } from '@midwayjs/validate';
import { SysConfig } from '../model/sys_config';

/**参数配置信息 控制层处理 */
@Controller('/system/config')
export class SysConfigController {
  @Inject()
  private contextService: ContextService;

  @Inject()
  private sysConfigService: SysConfigService;

  /**
   * 参数配置列表
   * @returns 返回结果
   */
  @Get('/list')
  @PreAuthorize({ hasPermissions: ['system:config:list'] })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysConfigService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**
   * 参数配置信息
   */
  @Get('/:configId')
  @PreAuthorize({ hasPermissions: ['system:config:query'] })
  public async info(
    @Valid(RuleType.number().required()) @Param('configId') configId: number
  ): Promise<Resp> {
    if (configId <= 0) {
      return Resp.codeMsg(40010, 'bind err: configId is empty');
    }
    const configInfo = await this.sysConfigService.findById(configId);
    if (configInfo.configId === configId) {
      return Resp.okData(configInfo);
    }
    return Resp.err();
  }

  /**
   * 参数配置新增
   */
  @Post()
  @PreAuthorize({ hasPermissions: ['system:config:add'] })
  @OperateLog({
    title: '参数配置信息',
    businessType: BUSINESS_TYPE.INSERT,
  })
  public async add(@Body() body: SysConfig) {
    if (body.configId > 0) {
      return Resp.codeMsg(40010, 'bind err: configId not is empty');
    }

    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueByKey(
      body.configKey,
      0
    );
    if (!uniqueConfigKey) {
      return Resp.errMsg(
        `参数配置新增【${body.configKey}】失败，参数键名已存在`
      );
    }

    body.createBy = this.contextService.getUseName();
    const insertId = await this.sysConfigService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**
   * 参数配置修改
   */
  @Put()
  @PreAuthorize({ hasPermissions: ['system:config:edit'] })
  @OperateLog({
    title: '参数配置信息',
    businessType: BUSINESS_TYPE.UPDATE,
  })
  public async edit(@Body() body: SysConfig) {
    if (body.configId <= 0) {
      return Resp.codeMsg(40010, 'bind err: configId is empty');
    }

    // 检查是否存在
    const configInfo = await this.sysConfigService.findById(body.configId);
    if (!configInfo) {
      return Resp.errMsg('没有权限访问参数配置数据！');
    }

    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueByKey(
      body.configKey,
      body.configId
    );
    if (!uniqueConfigKey) {
      return Resp.errMsg(
        `参数配置修改【${body.configKey}】失败，参数键名已存在`
      );
    }

    configInfo.configType = body.configType;
    configInfo.configName = body.configName;
    configInfo.configKey = body.configKey;
    configInfo.configValue = body.configValue;
    configInfo.remark = body.remark;
    configInfo.updateBy = this.contextService.getUseName();
    const rows = await this.sysConfigService.update(configInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**
   * 参数配置删除
   */
  @Del('/:configId')
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  @OperateLog({
    title: '参数配置信息',
    businessType: BUSINESS_TYPE.DELETE,
  })
  public async remove(
    @Valid(RuleType.string().required()) @Param('configId') configId: string
  ) {
    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(configId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));
    const rows = await this.sysConfigService.deleteByIds(ids);
    if (rows > 0) {
      return Resp.okMsg(`删除成功: ${rows}`);
    }
    return Resp.err();
  }

  /**
   * 参数配置刷新缓存
   */
  @Put('/refresh')
  @RepeatSubmit()
  @PreAuthorize({ hasPermissions: ['system:config:remove'] })
  @OperateLog({
    title: '参数配置信息',
    businessType: BUSINESS_TYPE.CLEAN,
  })
  public async refresh(): Promise<Resp> {
    await this.sysConfigService.cacheClean('*');
    await this.sysConfigService.cacheLoad('*');
    return Resp.ok();
  }

  /**
   * 参数配置根据参数键名
   */
  @Get('/config-key/:configKey')
  public async configKey(
    @Valid(RuleType.string().required()) @Param('configKey') configKey: string
  ): Promise<Resp> {
    const data = await this.sysConfigService.findValueByKey(configKey);
    return Resp.okData(data);
  }

  /**
   * 导出参数配置信息
   */
  @Post('/export')
  @PreAuthorize({ hasPermissions: ['system:config:export'] })
  @OperateLog({
    title: '参数配置信息',
    businessType: BUSINESS_TYPE.EXPORT,
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysConfigService.findByPage(query);
    if (total === 0) {
      return Resp.codeMsg(40016, 'export data record as empty');
    }

    // 导出文件名称
    const fileName = `config_export_${rows.length}_${Date.now()}.xlsx`;
    const ctx = this.contextService.getContext();
    ctx.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    ctx.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysConfigService.exportData(rows, fileName);
  }
}
