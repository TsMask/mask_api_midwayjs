import { ErrorCatch } from './error-catch';
import { Forbidden } from './forbidden';
import { NotFound } from './notfound';
import { Unauthorized } from './unauthorized';

/**
 * 异常错误捕获拦截器
 *
 * 请尽可能使用标准的抛出错误的形式，方便拦截器做处理。
 */
export const ErrorCatchFilters = [
  NotFound,
  Forbidden,
  Unauthorized,
  ErrorCatch,
];
