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
import { RuleType, Valid } from '@midwayjs/validate';
import { Context } from '@midwayjs/koa';

import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../framework/utils/parse/parse';
import {
  LIMIT_IP,
  RateLimitMiddleware,
} from '../../../framework/middleware/rate_limit';
import {
  BUSINESS_TYPE,
  OperateLogMiddleware,
} from '../../../framework/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../framework/middleware/authorize_user';
import { RepeatSubmitMiddleware } from '../../../framework/middleware/repeat_submit';
import { loginUserToUserName } from '../../../framework/reqctx/auth';
import { Resp } from '../../../framework/resp/api';
import { SysConfigService } from '../service/sys_config';
import { SysConfig } from '../model/sys_config';

/**参数配置信息 控制层处理 */
@Controller('/system/config')
export class SysConfigController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**参数配置服务 */
  @Inject()
  private sysConfigService: SysConfigService;

  /**参数配置列表 */
  @Get('/list', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:list'] }),
    ],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysConfigService.findByPage(query);
    return Resp.okData({ rows, total });
  }

  /**参数配置信息 */
  @Get('/:configId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:query'] }),
    ],
  })
  public async info(
    @Valid(RuleType.number().required()) @Param('configId') configId: number
  ): Promise<Resp> {
    if (configId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: configId is empty');
    }
    const data = await this.sysConfigService.findById(configId);
    if (data.configId === configId) {
      return Resp.okData(data);
    }
    return Resp.err();
  }

  /**参数配置新增 */
  @Post('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:add'] }),
      OperateLogMiddleware({
        title: '参数配置信息',
        businessType: BUSINESS_TYPE.INSERT,
      }),
    ],
  })
  public async add(@Body() body: SysConfig) {
    if (body.configId > 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: configId not is empty');
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

    body.createBy = loginUserToUserName(this.c);
    const insertId = await this.sysConfigService.insert(body);
    if (insertId > 0) {
      return Resp.okData(insertId);
    }
    return Resp.err();
  }

  /**参数配置修改 */
  @Put('', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:edit'] }),
      OperateLogMiddleware({
        title: '参数配置信息',
        businessType: BUSINESS_TYPE.UPDATE,
      }),
    ],
  })
  public async edit(@Body() body: SysConfig) {
    if (body.configId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: configId is empty');
    }

    // 检查是否存在
    const configInfo = await this.sysConfigService.findById(body.configId);
    if (configInfo.configId !== body.configId) {
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
    configInfo.updateBy = loginUserToUserName(this.c);
    const rows = await this.sysConfigService.update(configInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**参数配置删除 */
  @Del('/:configId', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:remove'] }),
      OperateLogMiddleware({
        title: '参数配置信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(RuleType.string().allow('')) @Param('configId') configId: string
  ) {
    if (configId === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: configId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(configId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysConfigService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功: ${rows}`);
  }

  /**参数配置刷新缓存 */
  @Put('/refresh', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['system:config:remove'] }),
      OperateLogMiddleware({
        title: '参数配置信息',
        businessType: BUSINESS_TYPE.CLEAN,
      }),
    ],
  })
  public async refresh(): Promise<Resp> {
    await this.sysConfigService.cacheClean('*');
    await this.sysConfigService.cacheLoad('*');
    return Resp.ok();
  }

  /**参数配置根据参数键名 */
  @Get('/config-key/:configKey', {
    middleware: [
      RateLimitMiddleware({
        time: 120,
        count: 15,
        type: LIMIT_IP,
      }),
    ],
  })
  public async configKey(
    @Valid(RuleType.string().allow('')) @Param('configKey') configKey: string
  ): Promise<Resp> {
    if (configKey === '') {
      this.c.status = 422;
      return Resp.codeMsg(422002, 'bind err: configKey is empty');
    }
    const key = await this.sysConfigService.findValueByKey(configKey);
    return Resp.okData(key);
  }

  /**导出参数配置信息 */
  @Get('/export', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:export'] }),
      OperateLogMiddleware({
        title: '参数配置信息',
        businessType: BUSINESS_TYPE.EXPORT,
      }),
    ],
  })
  public async export(@Query() query: Record<string, string>) {
    // 查询结果，根据查询条件结果，单页最大值限制
    const [rows, total] = await this.sysConfigService.findByPage(query);
    if (total === 0) {
      return Resp.errMsg('export data record as empty');
    }

    // 导出文件名称
    const fileName = `config_export_${rows.length}_${Date.now()}.xlsx`;
    this.c.set(
      'content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    this.c.set(
      'content-disposition',
      `attachment;filename=${encodeURIComponent(fileName)}`
    );
    return await this.sysConfigService.exportData(rows, fileName);
  }
}
