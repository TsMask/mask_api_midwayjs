import { ReportMiddleware } from './ReportMiddleware';
import { XssFilterMiddleware } from './XssFilterMiddleware';

/**
 * 中间件
 *
 * 列表存在执行顺序
 */
export const Middlewares = [ReportMiddleware, XssFilterMiddleware];
