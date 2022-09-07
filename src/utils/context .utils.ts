/**
 * 解析数值型
 * @param str 字符串
 */
export function parse_number(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return Number(str) || 0;
}

/**
 * 解析布尔型
 * @param str 字符串
 */
export function parse_boolean(str: string | number): boolean {
  if (typeof str === 'number') return Boolean(str);
  if (!str || str === 'false' || str === '0') return false;
  return Boolean(str) || false;
}

/**
 * 解析下划线转驼峰
 * @param str 字符串 a_b
 * @returns  驼峰风格 aB
 */
export function parse_line_to_hump(str: string): string {
  if (!str) return str;
  return str.replace(/_(\w)/g, (_item, letter) => letter.toUpperCase());
}

/**
 * 解析驼峰转下划线
 * @param str 字符串 aB
 * @returns  下划线风格 a_b
 */
export function parse_hump_to_line(str: string): string {
  if (!str) return str;
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 解析掩码手机号
 * @param mobile 11位手机号 字符串
 * @returns 掩码 136****2738
 */
export function parse_mask_mobile(mobile: string): string {
  if (!mobile || mobile.length !== 11) return mobile;
  return mobile.replace(/(\d{3})\d*(\d{4})/, '$1****$2');
}

/**
 * 解析掩码邮箱号
 * @param mobile 邮箱号 字符串
 * @returns 掩码 136****2738
 */
export function parse_mask_email(email: string): string {
  if (!email || !email.includes('@')) return email;
  const strArr = email.split('@');
  const prefix = strArr[0];
  if (prefix.length < 3) return email;
  const mask = Array.from({ length: prefix.length - 3 }, () => '*').join('');
  return `${prefix.slice(0, 3)}${mask}@${strArr[1]}`;
}

// == 下面的未知使用，不确定删除 ==

/**
 * 获取请求系统类型 ios android pc
 * @param ua 请求userAgent  navigator.userAgent
 * @returns 'pc' | string
 */
export function getOS(ua: string): string {
  if (/darwin|iphone|ipad|ipod|macintosh|cfnetwork|mac/i.test(ua)) return 'ios';
  if (/linux|android|adr|okhttp/i.test(ua)) return 'android';
  return 'pc';
}
