import { IMiddleware, Middleware, createMiddleware } from '@midwayjs/core';
import { NextFunction, Context } from '@midwayjs/koa';

import {
  SYS_PERMISSION_SYSTEM,
  SYS_ROLE_SYSTEM_KEY,
} from '../constants/system';
import { CTX_LOGIN_USER } from '../constants/common';
import { authorization } from '../reqctx/context';
import { UserTokenService } from '../token/user_token';
import { Resp } from '../resp/api';

/** 授权限制参数 */
interface Options {
  /**只需含有其中角色 */
  hasRoles?: string[];
  /**只需含有其中权限 */
  hasPerms?: string[];
  /**同时匹配其中角色 */
  matchRoles?: string[];
  /**同时匹配其中权限 */
  matchPerms?: string[];
}

/**用户身份授权认证校验-中间件 */
@Middleware()
export class AuthorizeUser implements IMiddleware<Context, NextFunction> {
  resolve(_: any, options: Options) {
    return async (c: Context, next: NextFunction) => {
      const token: UserTokenService = await c.requestContext.getAsync(
        UserTokenService
      );

      // 获取请求头标识信息
      const tokenStr = authorization(c);
      if (tokenStr === '') {
        c.status = 401;
        return Resp.codeMsg(401003, 'authorization token is empty');
      }

      // 验证令牌
      const [claims, err] = await token.userTokenVerify(tokenStr, 'access');
      if (err) {
        c.status = 401;
        return Resp.codeMsg(401001, err);
      }

      // 获取缓存的用户信息
      let info = await token.userInfoGet(claims);
      if (info.userId <= 0) {
        c.status = 401;
        return Resp.codeMsg(401002, 'invalid login user information');
      }
      c.setAttr(CTX_LOGIN_USER, info);

      // 登录用户角色权限校验
      if (options) {
        const roles = info.user.roles.map(item => item.roleKey);
        const perms = info.permissions;
        const verifyOk = verifyRolePermission(roles, perms, options);
        if (!verifyOk) {
          c.status = 403;
          return Resp.codeMsg(
            403001,
            `unauthorized access ${c.method} ${c.path}`
          );
        }
      }

      // 调用下一个处理程序
      return await next();
    };
  }

  static getName(): string {
    return 'AUTHORIZE_USER';
  }
}

/**
 * 用户身份授权认证校验-中间件
 *
 * @param options 授权限制参数
 */
export function AuthorizeUserMiddleware(options?: Options) {
  return createMiddleware(AuthorizeUser, options, AuthorizeUser.getName());
}

/**
 * 校验角色权限是否满足
 * @param roles 角色字符数组
 * @param permissions 权限字符数组
 * @param options 装饰器参数
 * @returns 返回结果
 */
function verifyRolePermission(
  roles: string[],
  permissions: string[],
  options: Options
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
  if (options.hasRoles && options.hasRoles.length > 0) {
    hasRole = options.hasRoles.some(r => roles.some(ur => ur === r));
  }
  // 只需含有其中权限
  let hasPerms = false;
  if (options.hasPerms && options.hasPerms.length > 0) {
    hasPerms = options.hasPerms.some(p =>
      permissions.some(up => up === p)
    );
  }
  // 同时匹配其中角色
  let matchRoles = false;
  if (options.matchRoles && options.matchRoles.length > 0) {
    matchRoles = options.matchRoles.every(r => roles.some(ur => ur === r));
  }
  // 同时匹配其中权限
  let matchPerms = false;
  if (options.matchPerms && options.matchPerms.length > 0) {
    matchPerms = options.matchPerms.every(p =>
      permissions.some(up => up === p)
    );
  }

  // 同时判断 含有其中
  if (options.hasRoles && options.hasPerms) {
    return hasRole || hasPerms;
  }
  // 同时判断 匹配其中
  if (options.matchRoles && options.matchPerms) {
    return matchRoles && matchPerms;
  }
  // 同时判断 含有其中且匹配其中
  if (options.hasRoles && options.matchPerms) {
    return hasRole && matchPerms;
  }
  if (options.hasPerms && options.matchRoles) {
    return hasPerms && matchRoles;
  }
  return hasRole || hasPerms || matchRoles || matchPerms;
}
