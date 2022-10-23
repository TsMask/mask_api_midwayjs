/**
 * 解析数值型
 * @param str 字符串
 */
export function parseNumber(str: string | number): number {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return Number(str) || 0;
}

/**
 * 解析布尔型
 * @param str 字符串
 */
export function parseBoolean(str: string | number): boolean {
  if (typeof str === 'number') return Boolean(str);
  if (!str || str === 'false' || str === '0') return false;
  return Boolean(str) || false;
}

/**
 * 解析首字母转大写
 * @param str 字符串 ab
 * @returns 结果 Ab
 */
export function parsefirstUpper(str: string): string {
  if (!str) return str;
  return str.substring(0, 1).toUpperCase() + str.substring(1);
}

/**
 * 解析下划线转驼峰
 * @param str 字符串 a_b
 * @returns  驼峰风格 aB
 */
export function parseStrLineToHump(str: string): string {
  if (!str) return str;
  return str.replace(/_(\w)/g, (_item, letter) => letter.toUpperCase());
}

/**
 * 解析驼峰转下划线
 * @param str 字符串 aB
 * @returns  下划线风格 a_b
 */
export function parseStrHumpToLine(str: string): string {
  if (!str) return str;
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * 对象的key值驼峰转下划线
 * @param obj 对象属性 字符数组orJSON对象
 * @returns 驼峰转下划线
 */
export function parseObjHumpToLine(obj: object) {
  if (Array.isArray(obj)) {
    return obj.map(v => parseObjHumpToLine(v));
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const new_key = parseStrHumpToLine(key);
      if (new_key !== key) {
        obj[new_key] = obj[key];
        delete obj[key];
      }
      obj[new_key] = parseObjHumpToLine(obj[new_key]);
    });
    return obj;
  }
  return obj;
}

/**
 * 对象的key值下划线转驼峰
 * @param obj 对象属性 字符数组orJSON对象
 * @returns 下划线转驼峰
 */
export function parseObjLineToHump(obj: any) {
  if (Array.isArray(obj)) {
    return obj.map(v => parseObjLineToHump(v));
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const new_key = parseStrLineToHump(key);
      if (new_key !== key) {
        obj[new_key] = obj[key];
        delete obj[key];
      }
      obj[new_key] = parseObjLineToHump(obj[new_key]);
    });
    return obj;
  }
  return obj;
}

/**
 * 解析掩码手机号
 * @param mobile 11位手机号 字符串
 * @returns 掩码 136****2738
 */
export function parseMaskMobile(mobile: string): string {
  if (!mobile || mobile.length !== 11) return mobile;
  return mobile.replace(/(\d{3})\d*(\d{4})/, '$1****$2');
}

/**
 * 解析掩码邮箱号
 * @param email 邮箱号 字符串
 * @returns 掩码 123****@
 */
export function parseMaskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const strArr = email.split('@');
  const prefix = strArr[0];
  if (prefix.length < 3) return email;
  const mask = Array.from({ length: prefix.length - 3 }, () => '*').join('');
  return `${prefix.slice(0, 3)}${mask}@${strArr[1]}`;
}
