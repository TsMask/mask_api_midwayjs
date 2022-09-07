/**
 * 判断是否为有效手机号格式
 * @param mobile 手机号字符串
 * @returns true | false
 */
export function valid_mobile(mobile: string): boolean {
  return /^(13[0-9]|14[01456879]|15[0-35-9]|16[2567]|17[0-8]|18[0-9]|19[0-35-9])\d{8}$/.test(
    mobile
  );
}

/**
 * 判断是否为有效邮箱格式
 * @param email 邮箱字符串
 * @returns true | false
 */
export function valid_email(email: string): boolean {
  return /^[a-z0-9A-Z]+[-|a-z0-9A-Z._]+@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?\\.)+[a-z]{2,}$/.test(
    email
  );
}

/**
 * 判断是否为有效密码格式
 * 密码至少包含大小写字母、数字、特殊符号，且不少于6位
 * @param password 密码字符串
 * @returns true | false
 */
export function valid_password(password: string): boolean {
  return /^(?![A-Za-z0-9]+$)(?![a-z0-9\W]+$)(?![A-Za-z\W]+$)(?![A-Z0-9\W]+$)[a-zA-Z0-9\W]{6,18}$/.test(
    password
  );
}

/**
 * 判断是否为有效用户名格式
 * 用户名不能以数字开头，可包含大写小写字母，数字，且不少于6位
 * @param username 用户名字符串
 * @returns true | false
 */
export function valid_username(username: string): boolean {
  return /^[a-zA-Z][a-z0-9A-Z]{5,15}$/.test(username);
}

/**
 * 判断是否为有效用户昵称格式
 * 用户昵称只能包含字母、数字、中文和下划线，且不少于2位
 * @param usernick 用户昵称字符串
 * @returns true | false
 */
export function valid_nick(usernick: string): boolean {
  return /^[\w\u4e00-\u9fa5-]{2,12}$/.test(usernick);
}

/**
 * 判断是否为有效身份证号格式
 * @param identity 身份证号字符串
 * @returns true | false
 */
export function valid_identity(identity: string): boolean {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(identity);
}
