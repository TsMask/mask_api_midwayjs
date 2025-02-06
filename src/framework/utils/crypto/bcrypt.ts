import { verify, hash } from '@node-rs/bcrypt';

/**
 * Bcrypt密码加密
 * @param originStr 原始密码
 * @returns 加密字符串
 */
export async function bcryptHash(originStr: string): Promise<string> {
  return await hash(originStr, 10);
}

/**
 * Bcrypt密码匹配检查
 * @param originStr 原始密码
 * @param hashStr 加密字符串
 * @returns 是否匹配
 */
export async function bcryptCompare(
  originStr: string,
  hashStr: string
): Promise<boolean> {
  return await verify(originStr, hashStr);
}
