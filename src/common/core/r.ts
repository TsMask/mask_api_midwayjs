import { SUCCESS, ERROR } from '../constant/http_status';

/**
 * 响应信息主体
 *
 * @author TsMask <340112800@qq.com>
 */

const MSG_SUCCESS = '成功';
const MSG_SUCCESS_QUERY = '查询成功';
const MSG_ERROR = '失败';

/**
 * 结果数据结构体类型
 * @param code 定义 http_status 状态码
 * @param msg 信息描述
 * @param data 数据对象，可选
 * @param rows 数据列表，可选
 * @param total 数据总数，可选
 */
export type R<T> = {
  code: number;
  msg: string;
  data?: T;
  rows?: T[];
  total?: number;
};

export function R<T>(
  data: T,
  code: number = SUCCESS,
  msg: string = MSG_SUCCESS,
  rows?: T[],
  total?: number
): R<T> {
  return {
    code,
    msg,
    data,
    rows,
    total,
  };
}

/**
 * 成功结果结构体
 */
export function R_OK(msg: string = MSG_SUCCESS): R<object> {
  return { code: SUCCESS, msg };
}

/**
 * 成功结果数据结构体
 * @param data 数据对象
 */
export function R_Ok_DATA<T>(data: T): R<T> {
  return {
    code: SUCCESS,
    msg: MSG_SUCCESS,
    data,
  };
}

/**
 * 成功结果数据结构体
 * @param rows 数据对象
 */
export function R_OK_ROWS<T>(rows: T[], total: number): R<T> {
  return {
    code: SUCCESS,
    msg: MSG_SUCCESS_QUERY,
    rows,
    total,
  };
}

/**
 * 失败结果结构体
 */
export function R_ERR(msg: string = MSG_ERROR): R<object> {
  return { code: ERROR, msg };
}

/**
 * 失败结果数据结构体
 * @param data 数据对象
 */
export function R_ERR_DATA<T>(data: T): R<T> {
  return {
    code: ERROR,
    msg: MSG_ERROR,
    data,
  };
}
