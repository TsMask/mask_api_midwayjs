/**
 * 返回状态码
 *
 * @author TsMask <340112800@qq.com>
 */

/**
 * 操作成功
 */
export const SUCCESS = 200;

/**
 * 对象创建成功
 */
export const CREATED = 201;

/**
 * 请求已经被接受
 */
export const ACCEPTED = 202;

/**
 * 操作已经执行成功，但是没有返回数据
 */
export const NO_CONTENT = 204;

/**
 * 资源已被移除
 */
export const MOVED_PERM = 301;

/**
 * 重定向
 */
export const SEE_OTHER = 303;

/**
 * 资源没有被修改
 */
export const NOT_MODIFIED = 304;

/**
 * 参数列表错误（缺少，格式不匹配）
 */
export const BAD_REQUEST = 400;

/**
 * 未授权
 */
export const UNAUTHORIZED = 401;

/**
 * 访问受限，授权过期
 */
export const FORBIDDEN = 403;

/**
 * 资源，服务未找到
 */
export const NOT_FOUND = 404;

/**
 * 不允许的http方法
 */
export const BAD_METHOD = 405;

/**
 * 资源冲突，或者资源被锁
 */
export const CONFLICT = 409;

/**
 * 不支持的数据，媒体类型
 */
export const UNSUPPORTED_TYPE = 415;

/**
 * 系统内部错误
 */
export const ERROR = 500;

/**
 * 接口未实现
 */
export const NOT_IMPLEMENTED = 501;
