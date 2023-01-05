import { REQUEST_OBJ_CTX_KEY } from '@midwayjs/core';
import { createCustomMethodDecorator, JoinPoint } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { OperatorBusinessTypeEnum } from '../enums/OperatorBusinessTypeEnum';
import { OperatorTypeEnum } from '../enums/OperatorTypeEnum';
import { getRealAddressByIp } from '../utils/ip2region';
import { SysOperLog } from '../../modules/monitor/model/SysOperLog';
import { SysOperLogServiceImpl } from '../../modules/monitor/service/impl/SysOperLogServiceImpl';
import { LoginUser } from '../model/LoginUser';
import { Result } from '../model/Result';
import {
  IP_INNER_ADDR,
  IP_INNER_LOCATION,
  STATUS_NO,
  STATUS_YES,
} from '../constants/CommonConstants';
import { parseSafeContent } from '../utils/ValueParseUtils';

/** 操作日志参数 */
interface operLogOptions {
  /**模块 */
  title: string;
  /**功能 */
  businessType: OperatorBusinessTypeEnum;
  /**操作人类别 */
  operatorType?: OperatorTypeEnum;
  /**是否保存请求的参数 */
  isSaveRequestData?: boolean;
  /**是否保存响应的参数 */
  isSaveResponseData?: boolean;
}

/**装饰器内部的唯一 key */
export const DECORATOR_METHOD_OPER_LOG_KEY = 'decorator_method:oper_log';

/**敏感属性字段进行掩码 */
const MASK_PROPERTIES = [
  'password',
  'oldPassword',
  'newPassword',
  'confirmPassword',
];

/**
 * 访问操作日志记录-方法装饰器
 *
 * 请在用户身份授权认证校验后使用以便获取登录用户信息
 * @param options 操作日志参数
 * @author TsMask <340112800@qq.com>
 */
export function OperLog(options: operLogOptions): MethodDecorator {
  return createCustomMethodDecorator(DECORATOR_METHOD_OPER_LOG_KEY, options);
}

/**
 * 实现装饰器-访问操作日志记录
 * @param options.metadata 方法装饰器参数
 * @returns 返回结果
 */
export function OperLogSave(options: { metadata: operLogOptions }) {
  return {
    around: async (joinPoint: JoinPoint) => {
      // 装饰器所在的实例上下文
      const ctx: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];
      // 初始可选参数数据
      const metadataObj = options.metadata;
      if (!metadataObj.operatorType) {
        metadataObj.operatorType = OperatorTypeEnum.MANAGE;
      }
      if (typeof metadataObj.isSaveRequestData === 'undefined') {
        metadataObj.isSaveRequestData = true;
      }
      if (typeof metadataObj.isSaveResponseData === 'undefined') {
        metadataObj.isSaveResponseData = true;
      }

      // 操作日志记录
      const operLog = new SysOperLog();
      operLog.title = metadataObj.title;
      operLog.businessType = metadataObj.businessType;
      operLog.operatorType = metadataObj.operatorType;
      const className = joinPoint.target.constructor.name;
      operLog.method = `${className}.${joinPoint.methodName}()`;
      operLog.operUrl = ctx.path;
      operLog.requestMethod = ctx.method;
      // 解析ip地址
      if (ctx.ip.includes(IP_INNER_ADDR)) {
        operLog.operIp = IP_INNER_ADDR;
        operLog.operLocation = IP_INNER_LOCATION;
      } else {
        operLog.operIp = ctx.ip;
        operLog.operLocation = await getRealAddressByIp(ctx.ip);
      }

      // 获取登录用户信息
      const loginUser: LoginUser = ctx.loginUser;
      if (loginUser && loginUser.userId) {
        operLog.operName = loginUser.user.userName;
        operLog.deptName = loginUser.user.dept?.deptName;
        if (loginUser.user.userType !== '00') {
          operLog.operatorType = OperatorTypeEnum.OTHER;
        }
      }

      // 是否需要保存request，参数和值
      if (metadataObj.isSaveRequestData) {
        const params: Record<string, any> = Object.assign(
          {},
          ctx.request.body,
          ctx.request.query
        );
        for (const key in params) {
          if (Object.prototype.hasOwnProperty.call(params, key)) {
            if (MASK_PROPERTIES.includes(key)) {
              params[key] = parseSafeContent(params[key]);
            }
          }
        }
        operLog.operParam = JSON.stringify(params).substring(0, 2000);
      }

      // 执行原方法
      const result = await joinPoint.proceed(...joinPoint.args);

      // 是否需要保存response，参数和值
      if (metadataObj.isSaveResponseData) {
        // 二进制流文件记录响应文件名
        if (Buffer.isBuffer(result)) {
          operLog.jsonResult =
            ctx.response.headers['content-disposition'].toString();
        } else {
          operLog.jsonResult = JSON.stringify(result).substring(0, 2000);
        }
      }

      // 保存操作记录到数据库
      const sysOperLogService: SysOperLogServiceImpl =
        await ctx.requestContext.getAsync(SysOperLogServiceImpl);
      operLog.status = STATUS_YES;
      if (result instanceof Result) {
        operLog.status = result.code === 200 ? STATUS_YES : STATUS_NO;
      }
      await sysOperLogService.insertOperLog(operLog);

      // 返回执行结果
      return result;
    },
  };
}
