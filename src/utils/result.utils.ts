// 1000 ~ 1999 PARAM_表示参数错误 ===========

/**
 * 参数无效
 */
export const PARAM_IS_INVALID: ResultDTO = {
  code: 1001,
  msg: '参数无效',
};

/**
 * 参数为空
 */
export const PARAM_IS_BLANK: ResultDTO = {
  code: 1002,
  msg: '参数为空',
};

/**
 * 参数类型错误
 */
export const PARAM_TYPE_BIND_ERROR: ResultDTO = {
  code: 1003,
  msg: '参数类型错误',
};

/**
 * 参数缺少
 */
export const PARAM_NOT_COMPLETE: ResultDTO = {
  code: 1004,
  msg: '参数缺少',
};

// 2000 ~ 2999 USER_表示用户数据错误 ========

/**
 * 用户未登录
 */
export const USER_NOT_LOGGIN_IN: ResultDTO = {
  code: 2001,
  msg: '用户未登录,请登录！',
};

/**
 * 用户名不存在或密码错误
 */
export const USER_NAME_LOGIN_ERROR: ResultDTO = {
  code: 2002,
  msg: '用户名不存在或密码错误',
};

/**
 * 用户名格式错误
 */
export const USER_NAME_FORMAT_ERROR: ResultDTO = {
  code: 2003,
  msg: '用户名只能包含大写小写字母，数字，且不少于6位',
};

/**
 * 用户昵称格式错误
 */
export const USER_NICK_FORMAT_ERROR: ResultDTO = {
  code: 2003,
  msg: '用户昵称只能包含字母、数字、中文和下划线，且不少于2位',
};

/**
 * 用户昵称已存在
 */
export const USER_NICK_EXIST_ERROR: ResultDTO = {
  code: 2003,
  msg: '用户昵称已存在',
};

/**
 * 用户手机号不存在或密码错误
 */
export const USER_MOBILE_LOGIN_ERROR: ResultDTO = {
  code: 2004,
  msg: '用户手机号不存在或密码错误',
};

/**
 * 用户手机号不存在或未激活
 */
export const USER_MOBILE_NOT_CONFIRMED: ResultDTO = {
  code: 2004,
  msg: '用户手机号不存在或验证码不正确',
};

/**
 * 手机号码格式不合法
 */
export const USER_MOBILE_FORMAT_ERROR: ResultDTO = {
  code: 2005,
  msg: '手机号码格式不合法',
};

/**
 * 用户邮箱登录错误
 */
export const USER_EMAIL_LOGIN_ERROR: ResultDTO = {
  code: 2006,
  msg: '用户邮箱不存在或密码错误',
};

/**
 * 用户邮箱未激活
 */
export const USER_EMAIL_NOT_CONFIRMED: ResultDTO = {
  code: 2006,
  msg: '用户邮箱不存在或验证码不正确',
};

/**
 * 电子邮箱格式不合法
 */
export const USER_EMAIL_FORMAT_ERROR: ResultDTO = {
  code: 2007,
  msg: '电子邮箱格式不合法',
};

/**
 * 用户名密码格式错误
 */
export const USER_PASSWORD_FORMAT_ERROR: ResultDTO = {
  code: 2008,
  msg: '密码至少包含大小写字母、数字、特殊符号，且不少于6位',
};

/**
 * 用户不存在
 */
export const USER_NOT_EXIST: ResultDTO = {
  code: 2009,
  msg: '用户不存在',
};

/**
 * 用户已存在
 */
export const USER_HAS_EXIST: ResultDTO = {
  code: 2010,
  msg: '用户已存在',
};

// 3000 ~ 3999  SVERVIC_表示接口服务数据错误 ========

/**
 * 短信发送过于频繁
 */
export const SVERVIC_SMS_FREQUENTLY_ERROR: ResultDTO = {
  code: 3001,
  msg: '短信发送过于频繁',
};

/**
 * 邮件发送过于频繁
 */
export const SVERVIC_EMAIL_FREQUENTLY_ERROR: ResultDTO = {
  code: 3001,
  msg: '邮件发送过于频繁',
};

// ##########################################################

/**
 * 结果数据结构体
 * @param data 数据对象
 * @param code 定义u状态码
 * @param msg 信息描述
 */
export function RESULT_DATA(data: any, code?: number, msg?: string): ResultDTO {
  return {
    code,
    msg,
    data,
  };
}

/**
 * 成功结果数据结构体
 * @param data 数据对象
 */
export function SUCCESS_DATA(data: any): ResultDTO {
  return {
    ...SUCCESS,
    data,
  };
}

/**
 * 成功结果结构体
 */
export const SUCCESS: ResultDTO = {
  code: 200,
  msg: '成功',
};

/**
 * 失败结果数据结构体
 * @param data 数据对象
 */
export function FAILURE_DATA(data: any): ResultDTO {
  return {
    ...FAILURE,
    data,
  };
}

/**
 * 失败结果结构体
 */
export const FAILURE: ResultDTO = {
  code: 400,
  msg: '失败',
};

/**
 * 未定义异常
 * @param msg 信息描述
 * @param code 定义u状态码
 */
export function UNDEFINED_EXCEPTION(msg: string, code = 500): ResultDTO {
  return {
    code,
    msg,
  };
}

// ##########################################################

/**
 * 返回结果传输对象
 */
export interface ResultDTO {
  code: number;
  msg: string;
  data?: any;
}
