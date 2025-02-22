import {
  JoinPoint,
  REQUEST_OBJ_CTX_KEY,
  createCustomMethodDecorator,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import { Resp } from '../resp/api';
import { parseSafeContent } from '../utils/parse/parse';
import { STATUS_NO, STATUS_YES } from '../constants/common';
import { clientIP, realAddressByIp } from '../ip2region/ip2region';
import { SysLogOperate } from '../../modules/system/model/sys_log_operate';
import { SysLogOperateService } from '../../modules/system/service/sys_log_operate';
import { loginUserToUserName } from '../reqctx/auth';

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

/**装饰器key标识-访问操作日志记录 */
export const METHOD_KEY_OPER_LOG = 'decorator_method:operate_log';

/**敏感属性字段进行掩码 */
const MASK_PROPERTIES = [
  'password',
  'oldPassword',
  'newPassword',
  'confirmPassword',
];

/**
 * 装饰器声明-访问操作日志记录
 *
 * 请在用户身份授权认证校验后使用以便获取登录用户信息
 * @param options 操作日志参数
 */
export function OperateLog(options: Options): MethodDecorator {
  return createCustomMethodDecorator(METHOD_KEY_OPER_LOG, options);
}

/**
 * 实现装饰器-访问操作日志记录
 * @param options.metadata 方法装饰器参数
 * @returns 返回结果
 */
export function OpLerateLogSave(options: { metadata: Options }) {
  return {
    around: async (joinPoint: JoinPoint) => {
      // 装饰器所在的实例上下文
      const c: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];
      // 初始可选参数数据
      const metadataObj = options.metadata;
      if (typeof metadataObj.isSaveRequestData === 'undefined') {
        metadataObj.isSaveRequestData = true;
      }
      if (typeof metadataObj.isSaveResponseData === 'undefined') {
        metadataObj.isSaveResponseData = true;
      }

      // 函数名
      const className = joinPoint.target.constructor.name;
      const funcName = `${className}.${joinPoint.methodName}()`;

      // 解析ip地址
      const ipaddr = clientIP(c.ip);
      const location = await realAddressByIp(c.ip);

      // 获取登录用户信息
      const userName = loginUserToUserName(c);
      if (userName === '') {
        c.status = 401;
        return Resp.codeMsg(401, '无效身份授权');
      }

      // 操作日志记录
      const operLog = new SysLogOperate();
      operLog.title = metadataObj.title;
      operLog.businessType = metadataObj.businessType;
      operLog.operaMethod = funcName;
      operLog.operaUrl = c.path;
      operLog.operaUrlMethod = c.method;
      operLog.operaIp = ipaddr;
      operLog.operaLocation = location;
      operLog.operaBy = userName;

      // 是否需要保存request，参数和值
      if (metadataObj.isSaveRequestData) {
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

      // 执行原方法
      const res: Resp = await joinPoint.proceed(...joinPoint.args);

      // 响应状态
      const status = res.code;
      if (status === Resp.CODE_SUCCESS) {
        operLog.statusFlag = STATUS_YES;
      } else {
        operLog.statusFlag = STATUS_NO;
      }

      // 是否需要保存response，参数和值
      if (metadataObj.isSaveResponseData) {
        const contentDisposition = c.get('Content-Disposition');
        const contentType = c.get('Content-Type');
        const content = contentType + contentDisposition;
        const msg = `{"status":"${status}","size":"${c.length}","content-type":"${content}"}`;
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
    },
  };
}
