import { createHash, createHmac } from 'crypto';

/**
 * SHA-256哈希并编码为Base64 URL格式
 * @param str 原始字符串
 * @returns Base64 URL编码的SHA-256哈希字符串
 */
export function sha256ToBase64(str: string): string {
  const hash = createHash('sha256');
  hash.update(str);
  const base64Hash = hash.digest('base64');

  // 将Base64编码中的'+'替换为'-'，'/'替换为'_'，并去掉尾部的'='
  const base64UrlHash = base64Hash
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return base64UrlHash;
}

/**
 * SHA-256 HMAC算法
 * @param key 密钥
 * @param data 数据
 * @returns HMAC值的十六进制字符串
 */
export function sha256Hmac(key: string, data: string): string {
  const hmac = createHmac('sha256', key);
  hmac.update(data);
  return hmac.digest('hex');
}

/**
 * md5加密
 * @param str 原始字符
 * @returns 加密字符串
 */
export function md5(str: string): string {
  const hash = createHash('md5');
  hash.update(str);
  return hash.digest('hex');
}
