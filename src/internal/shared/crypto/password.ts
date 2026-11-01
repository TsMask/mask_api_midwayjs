import { hash, verify } from '@node-rs/argon2';

const ARGON2ID_OPTIONS = {
  algorithm: 2, // Argon2id
  version: 1, // 0x13
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 2,
  outputLen: 32,
};

/**
 * 密码哈希
 * @param originStr 原始密码
 * @returns 密码哈希值
 */
export async function passwordHash(originStr: string): Promise<string> {
  return await hash(originStr, ARGON2ID_OPTIONS);
}

/**
 * 验证密码
 * @param originStr 原始密码
 * @param hashStr 密码哈希值
 * @returns 是否匹配
 */
export async function passwordVerify(
  originStr: string,
  hashStr: string
): Promise<boolean> {
  return await verify(hashStr, originStr);
}
