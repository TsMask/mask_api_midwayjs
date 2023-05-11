import { DefaultErrorCatch } from './DefaultErrorCatch';
import { ForbiddenErrorCatch } from './ForbiddenErrorCatch';
import { NotFoundErrorCatch } from './NotFoundErrorCatch';
import { UnauthorizedErrorCatch } from './UnauthorizedErrorCatch';

/**
 * 异常错误捕获拦截器
 *
 * 请尽可能使用标准的抛出错误的形式，方便拦截器做处理。
 */
export const ErrorCatchFilters = [
  NotFoundErrorCatch,
  ForbiddenErrorCatch,
  UnauthorizedErrorCatch,
  DefaultErrorCatch,
];
