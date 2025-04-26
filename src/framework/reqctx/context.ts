import { type Context } from '@midwayjs/koa';

import { HEADER_KEY, HEADER_PREFIX } from '../constants/token';

/**
 * 解析请求头携带的令牌
 * @param c 上下文对象
 * @returns token字符串
 */
export function authorization(c: Context): string {
  const authHeader = c.get(HEADER_KEY);
  if (!authHeader) {
    return '';
  }
  // 拆分 Authorization 请求头，提取 JWT 令牌部分
  const tokenStr = authHeader.replace(HEADER_PREFIX, '');
  if (tokenStr.length > 64) {
    return tokenStr.trim();
  }
  return '';
}

/**
 * 用户是否为系统管理员
 * @param c 上下文对象
 * @param userId 用户ID
 * @returns boolen
 */
export function isSystemUser(c: Context, userId: number): boolean {
  if (userId <= 0) return false;
  // 从配置中获取系统管理员ID列表
  const configUser = c.app.getConfig('systemUser');
  if (Array.isArray(configUser.system)) {
    return configUser.system.includes(userId);
  }
  return false;
}
