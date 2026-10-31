import { hash, verify } from '@node-rs/argon2';

import { bcryptCompare } from './bcrypt';

const ARGON2ID_OPTIONS = {
  algorithm: 2, // Argon2id
  version: 1, // 0x13
  memoryCost: 64 * 1024,
  timeCost: 3,
  parallelism: 2,
  outputLen: 32,
};

export async function passwordHash(originStr: string): Promise<string> {
  return await hash(originStr, ARGON2ID_OPTIONS);
}

export async function passwordVerify(
  originStr: string,
  hashStr: string
): Promise<boolean> {
  if (hashStr.startsWith('$argon2')) {
    return await verify(hashStr, originStr);
  }
  return await bcryptCompare(originStr, hashStr);
}
