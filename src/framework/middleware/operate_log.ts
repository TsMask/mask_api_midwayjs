import {
  IMiddleware,
  Middleware,
  MidwayWebRouterService,
  createMiddleware,
} from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

import { SysLogOperateService } from '../../modules/system/service/sys_log_operate';
import { SysLogOperate } from '../../modules/system/model/sys_log_operate';
import { clientIP, realAddressByIp } from '../ip2region/ip2region';
import { STATUS_NO, STATUS_YES } from '../constants/common';
import { parseSafeContent } from '../utils/parse/parse';
import { loginUserToUserName } from '../reqctx/auth';
import { Resp } from '../resp/api';

/**操作日志-业务操作类型枚举 */
export enum BUSINESS_TYPE {
  /**其它 */
  OTHER = '0',
  /**新增 */
  INSERT = '1',
  /**修改 */
  UPDATE = '2',
  /**删除 */
  DELETE = '3',
  /**授权 */
  GRANT = '4',
  /**导出 */
  EXPORT = '5',
  /**导入 */
  IMPORT = '6',
  /**强退 */
  FORCE = '7',
  /**清空数据 */
  CLEAN = '8',
}

/** 操作日志参数 */
interface Options {
  /**标题 */
  title: string;
  /**类型 */
  businessType: BUSINESS_TYPE;
  /**是否保存请求的参数 */
  isSaveRequestData?: boolean;
  /**是否保存响应的参数 */
  isSaveResponseData?: boolean;
}

/**敏感属性字段进行掩码 */
const MASK_PROPERTIES = [
  'password',
  'oldPassword',
  'newPassword',
  'confirmPassword',
];

/**访问操作日志记录-中间件 */
@Middleware()
export class OperateLog implements IMiddleware<Context, NextFunction> {
  resolve(_: any, options: Options) {
    return async (c: Context, next: NextFunction) => {
      // 初始可选参数数据
      if (typeof options.isSaveRequestData === 'undefined') {
        options.isSaveRequestData = true;
      }
      if (typeof options.isSaveResponseData === 'undefined') {
        options.isSaveResponseData = true;
      }

      // 获取执行函数名称
      const routerService = await c.requestContext.getAsync(
        MidwayWebRouterService
      );
      const routerInfo = await routerService.getMatchedRouterInfo(
        c.path,
        c.method
      );
      const funcName = `${routerInfo.controllerClz.name}.${routerInfo.method}`;

      // 解析ip地址
      const ipaddr = clientIP(c.ip);
      const location = await realAddressByIp(c.ip);

      // 获取登录用户信息
      const userName = loginUserToUserName(c);
      if (userName === '') {
        c.status = 401;
        return Resp.codeMsg(401002, 'invalid login user information');
      }

      // 操作日志记录
      const operLog = new SysLogOperate();
      operLog.title = options.title;
      operLog.businessType = options.businessType;
      operLog.operaMethod = funcName;
      operLog.operaUrl = c.path;
      operLog.operaUrlMethod = c.method;
      operLog.operaIp = ipaddr;
      operLog.operaLocation = location;
      operLog.operaBy = userName;

      // 是否需要保存request，参数和值
      if (options.isSaveRequestData) {
        const params: Record<string, any> = Object.assign(
          {},
          c.request.body,
          c.request.query
        );
        // 敏感属性字段进行掩码
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            if (MASK_PROPERTIES.includes(key)) {
              params[key] = parseSafeContent(params[key]);
            }
          }
        }
        operLog.operaParam = JSON.stringify(params).substring(0, 2000);
      }

      // 调用下一个处理程序
      const res = await next();

      // 响应状态
      const status = res.code;
      if (status === Resp.CODE_SUCCESS) {
        operLog.statusFlag = STATUS_YES;
      } else {
        operLog.statusFlag = STATUS_NO;
      }

      // 是否需要保存response，参数和值
      if (options.isSaveResponseData) {
        const contentDisposition = c.get('Content-Disposition');
        const contentType =
          c.get('Content-Type') || 'application/json; charset=utf-8';
        const content = contentType + contentDisposition;
        const msg = `{"status":"${status}","size":${
          JSON.stringify(res).length
        },"content-type":"${content}"}`;
        operLog.operaMsg = msg;
      }

      // 日志记录时间
      operLog.costTime = Date.now() - c.startTime;

      // 保存操作记录到数据库
      const sysLogOperateService: SysLogOperateService =
        await c.requestContext.getAsync(SysLogOperateService);
      await sysLogOperateService.insert(operLog);

      // 返回执行结果
      return res;
    };
  }

  static getName(): string {
    return 'OPER_LOG';
  }
}

/**
 * 访问操作日志记录-中间件
 *
 * 请在用户身份授权认证校验后使用以便获取登录用户信息
 * @param options 操作日志参数
 */
export function OperateLogMiddleware(options: Options) {
  return createMiddleware(OperateLog, options, OperateLog.getName());
}
