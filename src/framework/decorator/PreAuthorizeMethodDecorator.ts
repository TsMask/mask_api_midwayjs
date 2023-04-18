import { REQUEST_OBJ_CTX_KEY } from '@midwayjs/core';
import {
  ForbiddenError,
  UnauthorizedError,
} from '@midwayjs/core/dist/error/http';
import { createCustomMethodDecorator, JoinPoint } from '@midwayjs/decorator';
import { Context } from '@midwayjs/koa';
import { ADMIN_PERMISSION, ADMIN_ROLE_KEY } from '../constants/AdminConstants';
import { TOKEN_HEADER } from '../constants/TokenConstants';
import { LoginUser } from '../model/LoginUser';
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
export const DECORATOR_METHOD_PRE_AUTHORIZE_KEY =
  'decorator_method:pre_authorize';

/**
 * 用户身份授权认证校验-方法装饰器
 *
 * @param options 授权限制参数
 * @author TsMask
 */
export function PreAuthorize(options?: AuthOptions): MethodDecorator {
  return createCustomMethodDecorator(
    DECORATOR_METHOD_PRE_AUTHORIZE_KEY,
    options
  );
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
      const ctx: Context = joinPoint.target[REQUEST_OBJ_CTX_KEY];

      const tokenService: TokenService = await ctx.requestContext.getAsync(
        TokenService
      );

      // 获取token在请求头标识信息
      const token = await tokenService.getHeaderToken(ctx.get(TOKEN_HEADER));
      if (!token) {
        throw new UnauthorizedError('无效授权');
      }

      // 获取用户信息
      let loginUser: LoginUser = await tokenService.getLoginUser(token);
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
          throw new ForbiddenError(`${ctx.method} ${ctx.path} 无权访问`);
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
    roles.includes(ADMIN_ROLE_KEY) ||
    permissions.includes(ADMIN_PERMISSION)
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
  return hasRole || hasPermission || matchRoles || matchPermissions;
}
