import { SUCCESS, ERROR } from '../../common/constant/http_status';

/**
 * 响应信息主体
 *
 * @author TsMask <340112800@qq.com>
 */

const MSG_SUCCESS = '成功';
const MSG_ERROR = '失败';

/**
 * 结果数据结构体类型
 * @param code 定义 http_status 状态码
 * @param msg 信息描述
 * @param key 自定义数据字段
 */
export type R = {
  code: number;
  msg: string;
  [key: string]: any;
};

export function R(data: R): R {
  return data;
}

/**
 * 成功结果结构体
 * @param args 额外参数 {key:1}
 * @returns R
 */
export function R_OK(args?: Record<string, any>): R {
  return { code: SUCCESS, msg: MSG_SUCCESS, ...args };
}

/**
 * 成功结果数据结构体
 * @param data 数据对象
 */
export function R_Ok_DATA<T>(data: T): R {
  return {
    code: SUCCESS,
    msg: MSG_SUCCESS,
    data,
  };
}

/**
 * 失败结果结构体
 */
export function R_ERR(args?: Record<string, any>): R {
  return { code: ERROR, msg: MSG_ERROR, ...args };
}

/**
 * 失败结果数据结构体
 * @param data 数据对象
 */
export function R_ERR_DATA<T>(data: T): R {
  return {
    code: ERROR,
    msg: MSG_ERROR,
    data,
  };
}
