import { REQUEST_OBJ_CTX_KEY } from '@midwayjs/core';
import {
  ForbiddenError,
  UnauthorizedError,
} from '@midwayjs/core/dist/error/http';
import { createCustomMethodDecorator, JoinPoint } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { LoginUser } from '../core/vo/LoginUser';
import { TokenService } from '../service/TokenService';

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

/**装饰器内部的唯一 key */
export const DECORATOR_PRE_AUTHORIZE_KEY = 'decorator:pre_authorize';

/**
 * 用户身份授权认证校验-方法装饰器
 * @param options 授权限制参数
 * @author TsMask <340112800@qq.com>
 */
export function PreAuthorize(options?: AuthOptions): MethodDecorator {
  return createCustomMethodDecorator(DECORATOR_PRE_AUTHORIZE_KEY, options);
}

/**
 * 实现装饰器授权认证
 * @param options.metadata 方法装饰器参数
 * @returns 返回结果
 */
export function PreAuthorizeVerify(options: { metadata: AuthOptions }) {
  return {
    around: async (joinPoint: JoinPoint) => {
      // 装饰器所在的实例上下文
      const ctx: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];

      // 获取用户信息
      const tokenService: TokenService = await ctx.requestContext.getAsync(
        TokenService
      );
      let loginUser: LoginUser = await tokenService.getLoginUser();
      if (loginUser && loginUser.userId) {
        loginUser = await tokenService.verifyToken(loginUser);
        ctx.loginUser = loginUser;
      } else {
        throw new UnauthorizedError('无效授权');
      }

      // 登录用户角色权限校验
      const metadataObj = options.metadata;
      if (metadataObj) {
        const rolesArr = ctx.loginUser.user.roles.map(item => item.roleKey);
        const permissionsArr = ctx.loginUser.permissions;
        const verifyOk = verifyRolePermission(
          rolesArr,
          permissionsArr,
          metadataObj
        );
        if (!verifyOk) {
          throw new ForbiddenError(`${ctx.method} ${ctx.path} ，无权访问`);
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
  if (roles.includes('admin') || permissions.includes('*:*:*')) {
    return true;
  }

  // 只需含有其中角色
  let hasRole = false;
  if (metadata.hasRoles && metadata.hasRoles.length > 0) {
    hasRole = metadata.hasRoles.some(key => roles.some(r => r === key));
  }
  // 只需含有其中权限
  let hasPermission = false;
  if (metadata.hasPermissions && metadata.hasPermissions.length > 0) {
    hasPermission = metadata.hasPermissions.some(key =>
      permissions.some(r => r === key)
    );
  }
  // 同时匹配其中角色
  let matchRoles = false;
  if (metadata.matchRoles && metadata.matchRoles.length > 0) {
    matchRoles = metadata.matchRoles.every(key => roles.some(r => r === key));
  }
  // 同时匹配其中权限
  let matchPermissions = false;
  if (metadata.matchPermissions && metadata.matchPermissions.length > 0) {
    matchPermissions = metadata.matchPermissions.every(key =>
      permissions.some(r => r === key)
    );
  }

  console.log('\nPreAuthorize   ================ ');
  console.log('PreAuthorize   has ', hasRole, hasPermission);
  console.log('PreAuthorize mathc ', matchRoles, matchPermissions);
  console.log('PreAuthorize   ================ \n');

  // 同时判断 只需含有其中
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
  return hasRole || hasPermission || hasPermission || matchRoles;
}
