export class Resp {
  code: number;
  msg: string;
  [key: string]: any;

  // 响应-code错误失败
  static CODE_ERROR = 400001;
  // 响应-msg错误失败
  static MSG_ERROR = 'error';
  // 响应-msg正常成功
  static CODE_SUCCESS = 200001;
  // 响应-code正常成功
  static MSG_SUCCESS = 'success';

  /**
   * 响应结果
   * @param code 响应状态码
   * @param msg 响应信息
   * @returns 响应结果对象
   */
  static codeMsg(code: number, msg: string) {
    // 返回一个包含code和msg的对象
    return { code: code, msg: msg };
  }

  /**
   * 响应成功结果
   * @param args 额外参数 {value:1}
   * @return 响应结果对象
   */
  static ok(args?: Record<string, any>) {
    return { code: this.CODE_SUCCESS, msg: this.MSG_SUCCESS, ...args };
  }

  /**
   * 成功结果信息
   * @param msg 响应信息
   * @return 响应结果对象
   */
  static okMsg(msg: string) {
    return { code: this.CODE_SUCCESS, msg };
  }

  /**
   * 成功结果数据
   * @param data 数据值
   * @return 响应结果对象
   */
  static okData<T>(data: T) {
    return { code: this.CODE_SUCCESS, msg: this.MSG_SUCCESS, data };
  }

  /**
   * 失败结果
   * @param args 额外参数 {value:1}
   * @return 响应结果对象
   */
  static err(args?: Record<string, any>) {
    return { code: this.CODE_ERROR, msg: this.MSG_ERROR, ...args };
  }

  /**
   * 失败结果信息
   * @param msg 响应信息
   * @return 响应结果对象
   */
  static errMsg(msg: string) {
    return { code: this.CODE_ERROR, msg };
  }

  /**
   * 失败结果数据
   * @param data 数据值
   * @return 响应结果对象
   */
  static errData<T>(data: T) {
    return { code: this.CODE_ERROR, msg: this.MSG_ERROR, data };
  }
}
