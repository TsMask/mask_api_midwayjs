/**
 * 判断是否为http(s)://开头
 *
 * @param s 网络链接
 * @returns true | false
 */
export function validHttp(s: string): boolean {
  if (!s) return false;
  return /^http(s)?:\/\/+/.test(s);
}

/**
 * 判断是否为有效用户名格式
 *
 * 用户账号只能包含大写小写字母，数字，且不少于4位
 * @param username 用户名字符串
 * @returns true | false
 */
export function validUsername(s: string): boolean {
  if (!s) return false;
  return /[a-z0-9A-Z]{3,}$/.test(s);
}

/**
 * 判断是否为有效手机号格式，1开头的11位手机号
 *
 * @param s 手机号字符串
 * @returns true | false
 */
export function validMobile(s: string): boolean {
  if (!s) return false;
  return /^1[3-9]\d{9}$/.test(s);
}

/**
 * 判断是否为有效密码格式
 *
 * 密码至少包含大小写字母、数字、特殊符号，且不少于6位
 * @param s 密码字符串
 * @returns true | false
 */
export function validPassword(s: string): boolean {
  if (!s) return false;
  return /^(?![A-Za-z0-9]+$)(?![a-z0-9\W]+$)(?![A-Za-z\W]+$)(?![A-Z0-9\W]+$)[a-zA-Z0-9\W]{6,}$/.test(
    s
  );
}

/**
 * 判断是否为有效邮箱格式
 *
 * @param s 邮箱字符串
 * @returns true | false
 */
export function validEmail(s: string): boolean {
  if (!s) return false;
  return /^(([^<>()\\.,;:\s@"]+(\.[^<>()\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/.test(
    s
  );
}

/**
 * 正则替换字符串中匹配的字符串
 * @param pattern 正则表达式字符串
 * @param src 源字符串
 * @param repl 替换字符串
 * @returns 替换后的字符串
 */
export function replace(pattern: string, src: string, repl: string): string {
  return src.replace(pattern, repl);
}
