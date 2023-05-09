/**
 * 令牌常量信息
 *
 * src\framework\service\TokenService.ts
 * src\modules\system\controller\SysLoginController.ts
 * @author TsMask
 */

/**令牌-数据响应字段 */
export const TOKEN_RESPONSE_FIELD = 'access_token';

/**令牌-请求头标识前缀 */
export const TOKEN_KEY_PREFIX = 'Bearer ';

/**令牌-请求头标识 */
export const TOKEN_KEY = 'Authorization';

/**令牌-JWT唯一标识字段 */
export const TOKEN_JWT_UUID = 'login_key';

/**令牌-JWT标识用户主键字段 */
export const TOKEN_JWT_KEY = 'user_id';
