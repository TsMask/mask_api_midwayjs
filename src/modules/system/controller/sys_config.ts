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
import { Valid } from '@midwayjs/validation';
import * as Joi from 'joi';
import type { Context } from '@midwayjs/koa';

import {
  parseNumber,
  parseRemoveDuplicatesToArray,
} from '../../../internal/shared/parse/parse';
import {
  LIMIT_IP,
  RateLimitMiddleware,
} from '../../../internal/web/middleware/rate_limit';
import {
  BUSINESS_TYPE,
  OperateLogMiddleware,
} from '../../../internal/web/middleware/operate_log';
import { AuthorizeUserMiddleware } from '../../../internal/web/middleware/authorize_user';
import { RepeatSubmitMiddleware } from '../../../internal/web/middleware/repeat_submit';
import { loginUserToUserName } from '../../../internal/web/reqctx/auth';
import { Resp } from '../../../internal/web/resp/api';
import { SysConfigService } from '../service/sys_config';
import { SysConfig } from '../model/sys_config';
import { CODE_PARAM_CHEACK } from '../../../internal/web/resp/code';

/**参数配置信息 控制层处理 */
@Controller('/api/v1/system/configs')
export class SysConfigController {
  /**上下文 */
  @Inject('ctx')
  private c: Context;

  /**参数配置服务 */
  @Inject()
  private sysConfigService: SysConfigService;

  /**参数配置列表 */
  @Get('/list', {
    middleware: [AuthorizeUserMiddleware({ hasPerms: ['system:config:list'] })],
  })
  public async list(@Query() query: Record<string, string>): Promise<Resp> {
    const [rows, total] = await this.sysConfigService.findByPage(query);
    return Resp.okData({ rows: rows, total });
  }

  /**参数配置信息 */
  @Get('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:query'] }),
    ],
  })
  public async info(
    @Valid(Joi.number().required()) @Param('id') configId: number
  ): Promise<Resp> {
    if (configId <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: configId is empty');
    }
    const data = await this.sysConfigService.findById(configId);
    if (data.id === configId) {
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
    if (body.id > 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id not is empty');
    }
    const valueTypeErr = this.sysConfigService.checkValidateValueType(
      body.config_value_type,
      body.config_value
    );
    if (valueTypeErr) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, valueTypeErr);
    }

    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueByKey(
      body.config_key,
      0
    );
    if (!uniqueConfigKey) {
      return Resp.errMsg(
        `参数配置新增【${body.config_key}】失败，参数键名已存在`
      );
    }

    body.create_by = loginUserToUserName(this.c);
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
    if (body.id <= 0) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: id is empty');
    }
    // 检查是否存在
    const configInfo = await this.sysConfigService.findById(body.id);
    if (configInfo.id !== body.id) {
      return Resp.errMsg('没有权限访问参数配置数据');
    }

    const valueTypeErr = this.sysConfigService.checkValidateValueType(
      body.config_value_type,
      body.config_value
    );
    if (valueTypeErr) {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, valueTypeErr);
    }

    // 检查属性值唯一
    const uniqueConfigKey = await this.sysConfigService.checkUniqueByKey(
      body.config_key,
      body.id
    );
    if (!uniqueConfigKey) {
      return Resp.errMsg(
        `参数配置修改【${body.config_key}】失败，参数键名已存在`
      );
    }

    configInfo.config_value_type = body.config_value_type;
    configInfo.config_group = body.config_group;
    configInfo.config_sort = body.config_sort;
    configInfo.config_status = body.config_status;
    configInfo.config_name = body.config_name;
    configInfo.config_key = body.config_key;
    configInfo.config_value = body.config_value;
    configInfo.remark = body.remark;
    configInfo.update_by = loginUserToUserName(this.c);
    const rows = await this.sysConfigService.update(configInfo);
    if (rows > 0) {
      return Resp.ok();
    }
    return Resp.err();
  }

  /**参数配置删除 */
  @Del('/:id', {
    middleware: [
      AuthorizeUserMiddleware({ hasPerms: ['system:config:remove'] }),
      OperateLogMiddleware({
        title: '参数配置信息',
        businessType: BUSINESS_TYPE.DELETE,
      }),
    ],
  })
  public async remove(
    @Valid(Joi.string().allow('')) @Param('id') configId: string
  ) {
    if (configId === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: configId is empty');
    }

    // 处理字符转id数组后去重
    const uniqueIDs = parseRemoveDuplicatesToArray(configId, ',');
    // 转换成number数组类型
    const ids = uniqueIDs.map(id => parseNumber(id));

    const [rows, err] = await this.sysConfigService.deleteByIds(ids);
    if (err) {
      return Resp.errMsg(err);
    }
    return Resp.okMsg(`删除成功！${rows}`);
  }

  /**参数配置刷新缓存 */
  @Put('/refresh', {
    middleware: [
      RepeatSubmitMiddleware(5),
      AuthorizeUserMiddleware({ hasPerms: ['system:config:remove'] }),
      OperateLogMiddleware({
        title: '参数配置信息',
        businessType: BUSINESS_TYPE.OTHER,
      }),
    ],
  })
  public async refresh(): Promise<Resp> {
    await this.sysConfigService.cacheClean('*');
    await this.sysConfigService.cacheLoad('*');
    return Resp.ok();
  }

  /**参数配置根据参数键名 */
  @Get('/config-key/:config_key', {
    middleware: [
      RateLimitMiddleware({
        time: 120,
        count: 15,
        type: LIMIT_IP,
      }),
    ],
  })
  public async config_key(
    @Valid(Joi.string().allow('')) @Param('config_key') config_key: string
  ): Promise<Resp> {
    if (config_key === '') {
      this.c.status = 422;
      return Resp.codeMsg(CODE_PARAM_CHEACK, 'bind err: config_key is empty');
    }
    const key = await this.sysConfigService.findValueByKey(config_key);
    if (key) {
      return Resp.okData(key);
    }
    return Resp.err();
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
    const fileName = `config_export_${rows.length}_${Date.now()}.csv`;
    this.c.set('content-Type', 'text/csv; charset=utf-8');
    this.c.set('content-disposition', `attachment; filename="${fileName}"`);
    return await this.sysConfigService.exportData(rows, fileName);
  }
}
