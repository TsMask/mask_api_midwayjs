import { SUCCESS, ERROR } from '../../common/constant/http_status';

/**
 * 响应信息主体
 *
 * @author TsMask <340112800@qq.com>
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
    return this.rest(SUCCESS, '成功', args);
  }

  /**
   * 成功结果信息
   * @param msg 响应信息
   * @param code 响应状态码
   * @return 响应结果对象
   */
  public static ok_msg(msg: string, code: number = SUCCESS) {
    return this.rest(code, msg);
  }

  /**
   * 成功结果数据
   * @param data 数据值
   * @return 响应结果对象
   */
  public static ok_data<T>(data: T) {
    return this.rest(SUCCESS, '成功', { data });
  }

  /**
   * 失败结果
   * @param args 额外参数 {value:1}
   * @return 响应结果对象
   */
  public static err(args?: Record<string, any>) {
    return this.rest(ERROR, '失败', args);
  }

  /**
   * 失败结果信息
   * @param msg 响应信息
   * @param code 响应状态码
   * @return 响应结果对象
   */
  public static err_msg(msg: string, code: number = ERROR) {
    return this.rest(code, msg);
  }

  /**
   * 失败结果数据
   * @param data 数据值
   * @return 响应结果对象
   */
  public static err_data<T>(data: T) {
    return this.rest(ERROR, '失败', { data });
  }

  /**
   * 定义响应结果对象
   * @param code 状态码
   * @param msg 响应信息
   * @param args 可展开的参数对象
   * @returns
   */
  public static rest(code: number, msg: string, args?: Record<string, any>) {
    const res = new Result();
    res.code = code;
    res.msg = msg;
    for (const key of Object.keys(args)) {
      res[key] = args[key];
    }
    return res;
  }
}
