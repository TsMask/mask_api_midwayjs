// 响应-code错误失败
const CODE_ERROR = 400;
// 响应-msg错误失败
const MSG_ERROR = '失败';
// 响应-msg正常成功
const CODE_SUCCESS = 200;
// 响应-code正常成功
const MSG_SUCCESS = '成功';

/**
 * 响应结果
 * @param code 响应状态码
 * @param msg 响应信息
 * @returns 响应结果对象
 */
function codeMsg(code: number, msg: string) {
  // 返回一个包含code和msg的对象
  return { code: code, msg: msg };
}

/**
 * 响应成功结果
 * @param args 额外参数 {value:1}
 * @return 响应结果对象
 */
function ok(args?: Record<string, any>) {
  return { code: CODE_SUCCESS, msg: MSG_SUCCESS, ...args };
}

/**
 * 成功结果信息
 * @param msg 响应信息
 * @return 响应结果对象
 */
function okMsg(msg: string) {
  return { code: CODE_SUCCESS, msg };
}

/**
 * 成功结果数据
 * @param data 数据值
 * @return 响应结果对象
 */
function okData<T>(data: T) {
  return { code: CODE_SUCCESS, msg: MSG_SUCCESS, data };
}

/**
 * 失败结果
 * @param args 额外参数 {value:1}
 * @return 响应结果对象
 */
function err(args?: Record<string, any>) {
  return { code: CODE_ERROR, msg: MSG_ERROR, ...args };
}

/**
 * 失败结果信息
 * @param msg 响应信息
 * @return 响应结果对象
 */
function errMsg(msg: string) {
  return { code: CODE_ERROR, msg };
}

/**
 * 失败结果数据
 * @param data 数据值
 * @return 响应结果对象
 */
function errData<T>(data: T) {
  return { code: CODE_ERROR, msg: MSG_ERROR, data };
}

export default {
  CODE_SUCCESS,
  CODE_ERROR,
  codeMsg,
  ok,
  okMsg,
  okData,
  err,
  errMsg: errMsg,
  errData,
};
