/**
 * 判断是否为http(s)://开头
 *
 * @param link 网络链接
 * @returns true | false
 */
export function validHttp(link: string): boolean {
  if (!link) return false;
  return /^http(s)?:\/\/+/.test(link);
}

/**
 * 判断是否为有效手机号格式
 *
 * @param mobile 手机号字符串
 * @returns true | false
 */
export function validMobile(mobile: string): boolean {
  if (!mobile) return false;
  return /^1[3|4|5|6|7|8|9][0-9]\d{8}$/.test(mobile);
}

/**
 * 判断是否为有效邮箱格式
 *
 * @param email 邮箱字符串
 * @returns true | false
 */
export function validEmail(email: string): boolean {
  if (!email) return false;
  return /^(([^<>()\\.,;:\s@"]+(\.[^<>()\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/.test(
    email
  );
}

/**
 * 判断是否为有效密码格式
 *
 * 密码至少包含大小写字母、数字、特殊符号，且不少于6位
 * @param password 密码字符串
 * @returns true | false
 */
export function validPassword(password: string): boolean {
  if (!password) return false;
  return /^(?![A-Za-z0-9]+$)(?![a-z0-9\W]+$)(?![A-Za-z\W]+$)(?![A-Z0-9\W]+$)[a-zA-Z0-9\W]{6,}$/.test(
    password
  );
}

/**
 * 判断是否为有效用户名格式
 *
 * 用户名不能以数字开头，可包含大写小写字母，数字，且不少于5位
 * @param username 用户名字符串
 * @returns true | false
 */
export function validUsername(username: string): boolean {
  if (!username) return false;
  return /^[a-zA-Z][a-z0-9A-Z]{5,}$/.test(username);
}

/**
 * 判断是否为有效用户昵称格式
 *
 * 用户昵称只能包含字母、数字、中文和下划线，且不少于2位
 * @param usernick 用户昵称字符串
 * @returns true | false
 */
export function validNick(usernick: string): boolean {
  if (!usernick) return false;
  return /^[\w\u4e00-\u9fa5-]{2,}$/.test(usernick);
}

/**
 * 判断是否为有效身份证号格式
 *
 * @param identity 身份证号字符串
 * @returns true | false
 */
export function validIdentity(identity: string): boolean {
  if (!identity) return false;
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(identity);
}
