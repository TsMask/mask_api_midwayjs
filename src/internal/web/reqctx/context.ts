import { type Context } from '@midwayjs/koa';

import { HEADER_KEY, HEADER_PREFIX } from '../../shared/constants/token';

/**
 * ??????????
 * @param c ?????
 * @returns token???
 */
export function authorization(c: Context): string {
  const authHeader = c.get(HEADER_KEY);
  if (!authHeader) {
    return '';
  }
  // ?? Authorization ?????? JWT ????
  const tokenStr = authHeader.replace(HEADER_PREFIX, '');
  if (tokenStr.length > 64) {
    return tokenStr.trim();
  }
  return '';
}

/**
 * ??????????
 * @param c ?????
 * @param userId ??ID
 * @returns boolen
 */
export function isSystemUser(c: Context, userId: number): boolean {
  if (userId <= 0) return false;
  const configUser = c.app.getConfig('systemUser');
  if (Array.isArray(configUser)) {
    return configUser.map(Number).includes(userId);
  }
  return false;
}
