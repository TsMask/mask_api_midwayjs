import {
  JoinPoint,
  REQUEST_OBJ_CTX_KEY,
  createCustomMethodDecorator,
} from '@midwayjs/core';
import { Context } from '@midwayjs/koa';

import {
  SYS_PERMISSION_SYSTEM,
  SYS_ROLE_SYSTEM_KEY,
} from '../constants/system';
import { CTX_LOGIN_USER } from '../constants/common';
import { authorization } from '../reqctx/context';
import { UserTokenService } from '../token/user_token';
import { Resp } from '../resp/api';

/** 授权限制参数 */
interface AuthOptions {
  /**只需含有其中角色 */
  hasRoles?: string[];
  /**只需含有其中权限 */
  hasPermissions?: string[];
  /**同时匹配其中角色 */
  matchRoles?: string[];
  /**同时匹配其中权限 */
  matchPermissions?: string[];
}

/**装饰器key标识-用户身份授权认证校验 */
export const METHOD_KEY_PRE_AUTHORIZE = 'decorator_method:pre_authorize';

/**
 * 装饰器声明-用户身份授权认证校验
 *
 * @param options 授权限制参数
 */
export function PreAuthorize(options?: AuthOptions): MethodDecorator {
  return createCustomMethodDecorator(METHOD_KEY_PRE_AUTHORIZE, options);
}

/**
 * 实现装饰器-用户身份授权认证校验
 *
 * @param options.metadata 方法装饰器参数
 * @returns 返回结果
 */
export function PreAuthorizeVerify(options: { metadata: AuthOptions }) {
  return {
    around: async (joinPoint: JoinPoint) => {
      // 装饰器所在的实例上下文
      const c: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];

      const tokenService: UserTokenService = await c.requestContext.getAsync(
        UserTokenService
      );

      // 获取请求头标识信息
      const tokenStr = authorization(c);
      if (tokenStr === '') {
        return Resp.codeMsg(401, '无效身份授权');
      }

      // 验证令牌
      const [claims, err] = await tokenService.userTokenVerify(tokenStr, 'access');
      if (err) {
        return Resp.codeMsg(401, err);
      }

      // 获取缓存的用户信息
      let info = await tokenService.userInfoGet(claims);
      if (info.userId <= 0) {
        c.status = 401;
        return Resp.codeMsg(401, 'token valid error');
      }
      c.setAttr(CTX_LOGIN_USER, info);

      // 登录用户角色权限校验
      const metadataObj = options.metadata;
      if (metadataObj) {
        const roles = info.user.roles.map(item => item.roleKey);
        const perms = info.permissions;
        const verifyOk = verifyRolePermission(roles, perms, metadataObj);
        if (!verifyOk) {
          c.status = 403;
          return Resp.codeMsg(403, `无权访问 ${c.method} ${c.path}`);
        }
      }

      // 返回 执行后续方法
      return await joinPoint.proceed(...joinPoint.args);
    },
  };
}

/**
 * 校验角色权限是否满足
 * @param roles 角色字符数组
 * @param permissions 权限字符数组
 * @param metadata 装饰器参数
 * @returns 返回结果
 */
function verifyRolePermission(
  roles: string[],
  permissions: string[],
  metadata: AuthOptions
): boolean {
  // 直接放行 管理员角色或任意权限
  if (
    roles.includes(SYS_ROLE_SYSTEM_KEY) ||
    permissions.includes(SYS_PERMISSION_SYSTEM)
  ) {
    return true;
  }

  // 只需含有其中角色
  let hasRole = false;
  if (metadata.hasRoles && metadata.hasRoles.length > 0) {
    hasRole = metadata.hasRoles.some(r => roles.some(ur => ur === r));
  }
  // 只需含有其中权限
  let hasPermission = false;
  if (metadata.hasPermissions && metadata.hasPermissions.length > 0) {
    hasPermission = metadata.hasPermissions.some(p =>
      permissions.some(up => up === p)
    );
  }
  // 同时匹配其中角色
  let matchRoles = false;
  if (metadata.matchRoles && metadata.matchRoles.length > 0) {
    matchRoles = metadata.matchRoles.every(r => roles.some(ur => ur === r));
  }
  // 同时匹配其中权限
  let matchPermissions = false;
  if (metadata.matchPermissions && metadata.matchPermissions.length > 0) {
    matchPermissions = metadata.matchPermissions.every(p =>
      permissions.some(up => up === p)
    );
  }

  // 同时判断 含有其中
  if (metadata.hasRoles && metadata.hasPermissions) {
    return hasRole || hasPermission;
  }
  // 同时判断 匹配其中
  if (metadata.matchRoles && metadata.matchPermissions) {
    return matchRoles && matchPermissions;
  }
  // 同时判断 含有其中且匹配其中
  if (metadata.hasRoles && metadata.matchPermissions) {
    return hasRole && matchPermissions;
  }
  if (metadata.hasPermissions && metadata.matchRoles) {
    return hasPermission && matchRoles;
  }
  return hasRole || hasPermission || matchRoles || matchPermissions;
}
