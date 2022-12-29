/**
 * 通用常量信息
 *
 * @author TsMask <340112800@qq.com>
 */

/**www主域 */
export const WWW = 'www.';

/**http请求 */
export const HTTP = 'http://';

/**https请求 */
export const HTTPS = 'https://';

/**验证码有效期，单位秒 */
export const CAPTCHA_EXPIRATION = 2 * 60;

/**令牌-数据响应字段 */
export const TOKEN_RESPONSE_FIELD = 'token';

/**令牌-请求头前缀 */
export const TOKEN_HEADER_PREFIX = 'Bearer ';

/**令牌-JWT中用户标识字段 */
export const TOKEN_JWT_FIELD = 'login_user_key';

/**响应-正常成功code */
export const RESULT_SUCCESS_CODE = 200;

/**响应-正常成功msg */
export const RESULT_SUCCESS_MSG = '成功';

/**响应-错误失败code */
export const RESULT_ERROR_CODE = 500;

/**响应-错误失败msg */
export const RESULT_ERROR_MSG = '失败';

/**通用状态标识-正常/成功/是 */
export const STATUS_YES = '0';

/**通用状态标识-停用/失败/否 */
export const STATUS_NO = '1';

/**管理员-系统指定角色ID */
export const ADMIN_ROLE_ID = '1';

/**管理员-系统指定角色KEY */
export const ADMIN_ROLE_KEY = 'admin';

/**管理员-系统指定权限 */
export const ADMIN_PERMISSION = '*:*:*';
