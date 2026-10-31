import {
  IMiddleware,
  Middleware,
  MidwayWebRouterService,
  createMiddleware,
} from '@midwayjs/core';
import { Context, NextFunction } from '@midwayjs/koa';

import { clientIP, realAddressByIp } from '../../infra/ip2region/ip2region';
import { STATUS_NO, STATUS_YES } from '../../shared/constants/common';
import { parseSafeContent } from '../../shared/parse/parse';
import { loginUserToUserName } from '../reqctx/auth';
import { CODE_AUTH_INVALID, CODE_SUCCESS } from '../resp/code';
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

/**通用操作日志记录，由业务模块注册 hook 后映射到具体模型 */
export interface OperationLogRecord {
  title: string;
  operationType: string;
  operationFunction: string;
  operationUrl: string;
  operationMethod: string;
  operationIp: string;
  operationLocation: string;
  createBy: string;
  operationParam: string;
  operationStatus: string;
  operationMsg: string;
  operationCostTime: number;
}

let onOperationLog: ((record: OperationLogRecord) => void | Promise<void>) | undefined;

export function registerOnOperationLog(
  handler: ((record: OperationLogRecord) => void | Promise<void>) | undefined
): void {
  onOperationLog = handler;
}

/**敏感属性字段进行掩码 */
const MASK_PROPERTIES = [
  'password',
  'oldPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'apiSecret',
  'privateKey',
  'publicKey',
  'creditCard',
  'cvv',
  'cardNumber',
  'idCard',
  'phone',
  'mobile',
  'email',
];

function maskSensitiveData(obj: Record<string, any>, depth = 0): Record<string, any> {
  if (depth > 3) return obj;
  if (typeof obj !== 'object' || obj === null) return obj;
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    const shouldMask = MASK_PROPERTIES.some(prop => lowerKey.includes(prop.toLowerCase()));
    if (shouldMask) result[key] = parseSafeContent(obj[key]);
    else if (typeof obj[key] === 'object' && obj[key] !== null) result[key] = maskSensitiveData(obj[key], depth + 1);
    else result[key] = obj[key];
  }
  return result;
}

@Middleware()
export class OperateLog implements IMiddleware<Context, NextFunction> {
  resolve(_: any, options: Options) {
    return async (c: Context, next: NextFunction) => {
      if (typeof options.isSaveRequestData === 'undefined') options.isSaveRequestData = true;
      if (typeof options.isSaveResponseData === 'undefined') options.isSaveResponseData = true;
      const routerService = await c.requestContext.getAsync(MidwayWebRouterService);
      const routerInfo = await routerService.getMatchedRouterInfo(c.path, c.method);
      if (!routerInfo) return await next();
      const funcName = `${routerInfo.controllerClz!.name}.${routerInfo.method}`;
      const ipaddr = clientIP(c.ip);
      const location = await realAddressByIp(c.ip);
      const userName = loginUserToUserName(c);
      if (userName === '') {
        c.status = 401;
        return Resp.codeMsg(CODE_AUTH_INVALID, 'invalid login user information');
      }
      const operLog: OperationLogRecord = {
        title: options.title,
        operationType: options.businessType,
        operationFunction: funcName,
        operationUrl: c.path,
        operationMethod: c.method,
        operationIp: ipaddr,
        operationLocation: location,
        createBy: userName,
        operationParam: '',
        operationStatus: '',
        operationMsg: '',
        operationCostTime: 0,
      };
      if (options.isSaveRequestData) {
        const params: Record<string, any> = Object.assign({}, c.request.body, c.request.query);
        operLog.operationParam = JSON.stringify(maskSensitiveData(params)).substring(0, 2000);
      }
      const res = await next();
      const status = res.code;
      operLog.operationStatus = status === CODE_SUCCESS ? STATUS_YES : STATUS_NO;
      if (options.isSaveResponseData) {
        const contentDisposition = c.get('Content-Disposition');
        const contentType = c.get('Content-Type') || 'application/json; charset=utf-8';
        operLog.operationMsg = JSON.stringify({ status: String(status), size: JSON.stringify(res).length, content_type: contentType + contentDisposition });
      }
      operLog.operationCostTime = Date.now() - c.startTime;
      if (onOperationLog) await onOperationLog(operLog);
      return res;
    };
  }

  static getName(): string {
    return 'OPER_LOG';
  }
}

export function OperateLogMiddleware(options: Options) {
  return createMiddleware(OperateLog as any, options, OperateLog.getName());
}