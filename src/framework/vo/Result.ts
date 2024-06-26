import {
  RESULT_CODE_ERROR,
  RESULT_MSG_ERROR,
  RESULT_CODE_SUCCESS,
  RESULT_MSG_SUCCESS,
} from '../constants/ResultConstants';

/**
 * 响应信息主体
 *
 * @author TsMask
 */
export class Result {
  /**响应状态码 */
  code: number;
  /**响应信息 */
  msg: string;
  /**其余自定义属性 */
  [key: string]: any;

  /**
   * 成功结果
   * @param args 额外参数 {value:1}
   * @return 响应结果对象
   */
  public static ok(args?: Record<string, any>) {
    return this.newResult(RESULT_CODE_SUCCESS, RESULT_MSG_SUCCESS, args);
  }

  /**
   * 成功结果信息
   * @param msg 响应信息
   * @param code 响应状态码
   * @return 响应结果对象
   */
  public static okMsg(msg: string, code: number = RESULT_CODE_SUCCESS) {
    return this.newResult(code, msg);
  }

  /**
   * 成功结果数据
   * @param data 数据值
   * @return 响应结果对象
   */
  public static okData<T>(data: T) {
    return this.newResult(RESULT_CODE_SUCCESS, RESULT_MSG_SUCCESS, { data });
  }

  /**
   * 失败结果
   * @param args 额外参数 {value:1}
   * @return 响应结果对象
   */
  public static err(args?: Record<string, any>) {
    return this.newResult(RESULT_CODE_ERROR, RESULT_MSG_ERROR, args);
  }

  /**
   * 失败结果信息
   * @param msg 响应信息
   * @param code 响应状态码
   * @return 响应结果对象
   */
  public static errMsg(msg: string, code: number = RESULT_CODE_ERROR) {
    return this.newResult(code, msg);
  }

  /**
   * 失败结果数据
   * @param data 数据值
   * @return 响应结果对象
   */
  public static errData<T>(data: T) {
    return this.newResult(RESULT_CODE_ERROR, RESULT_MSG_ERROR, { data });
  }

  /**
   * 定义响应结果对象
   * @param code 状态码
   * @param msg 响应信息
   * @param args 可展开的参数对象
   * @returns 返回结果
   */
  public static newResult(
    code: number,
    msg: string,
    args: Record<string, any> = {}
  ) {
    const res = new Result();
    res.code = code;
    res.msg = msg;
    // 展开参数混入
    for (const key of Object.keys(args)) {
      res[key] = args[key];
    }
    return res;
  }
}
