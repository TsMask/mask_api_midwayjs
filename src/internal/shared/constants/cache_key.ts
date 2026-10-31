// 缓存的key常量

/**登录用户会话标识（按 session_id 存储） */
export const CACHE_TOKEN_SESSION = 'token_sessions';

/**用户维度的会话索引 */
export const CACHE_TOKEN_USERS = 'token_users';

/**验证码 */
export const CACHE_CAPTCHA_CODE = 'captcha_codes';

/**手机号短信验证码 */
export const CACHE_SMS_CODE = 'sms_codes';

/**短信验证码发送冷却 */
export const CACHE_SMS_CODE_COOLDOWN = 'sms_codes_cooldown';

/**找回密码验证码 */
export const CACHE_PASSWORD_RESET_CODE = 'password_reset_codes';

/**找回密码验证码发送冷却 */
export const CACHE_PASSWORD_RESET_COOLDOWN = 'password_reset_cooldown';

/**参数管理 */
export const CACHE_SYS_CONFIG = 'sys_config';

/**字典管理 */
export const CACHE_SYS_DICT = 'sys_dict';

/**防重提交 */
export const CACHE_REPEAT_SUBMIT = 'repeat_submit';

/**限流 */
export const CACHE_RATE_LIMIT = 'rate_limit';

/**登录账户密码错误次数 */
export const CACHE_PWD_ERR_COUNT = 'pwd_err_count';
