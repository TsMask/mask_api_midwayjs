import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
} from 'crypto';
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

/**
 * 加密为 HMAC编码
 * @param text 编码字符串
 * @param secret 密钥加密
 * @param type 编码类型 sha 和 md5, 默认使用"sha1"
 * @returns 编码后字符串
 */
export function cryptoHmac(
  text: string,
  secret: string,
  type: 'sha1' | 'sha256' | 'sha512' | 'md5'
): string {
  return createHmac(type, secret).update(text).digest('hex');
}

// 下面的未知使用，不确定删除

type HashType = 'sha1' | 'sha256' | 'sha512' | 'md5';
type WXDataOptions = {
  // encryptedData 客户端数据
  encryptedData: string;
  // sessionKey 授权key
  key: string;
  // iv 客户端向量
  iv: string;
};

/**
 * HEX编码
 * @param text 编码字符串
 * @param type 编码类型 "md5"| "sha1"| "md5-sha1"
 */
export function encrypyHash(text: string, type: HashType = 'md5') {
  return createHash(type).update(text).digest('hex');
}

/**
 * AES对称加密
 * @param text 加密字符串
 * @param secret 密钥加密
 */
export function encrypyAES(text: string, secret: string) {
  return createCipheriv('aes-128-gcm', secret, '6d543a6bb2315759').update(
    text,
    'utf8',
    'hex'
  );
}

/**
 * AES对称解密
 * @param text 加密字符串
 * @param secret 密钥加密
 */
export function decrypyAES(text: string, secret: string) {
  try {
    return createDecipheriv('aes-128-gcm', secret, '6d543a6bb2315759').update(
      text,
      'hex',
      'utf8'
    );
  } catch (err) {
    throw new Error(err);
  }
}

/**
 * 微信数据解密
 * @param options 参数
 */
export function decryptWxData(options: WXDataOptions) {
  const { encryptedData, key, iv } = options;
  try {
    // 解密
    const decipher = createDecipheriv('aes-128-cbc', key, iv);
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true);
    let decoded = decipher.update(encryptedData, 'base64', 'utf8');
    decoded += decipher.final('utf8');
    return JSON.parse(decoded);
  } catch (err) {
    throw new Error(err);
  }
}
