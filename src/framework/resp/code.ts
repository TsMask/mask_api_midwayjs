// |HTTP|状态码|描述|排查建议|
// |----|----|----|----|
// |500 |500001 |internal error|服务内部错误|
// |200 |200999 |encrypt|正常请求加密数据|
// |200 |200001 |request success|正常请求成功|
// |200 |400001 |exist error|正常请求错误信息|
// |200 |400429 |ratelimit over|请求限流|
// |401 |401001 |authentication error|身份认证失败或者过期|
// |401 |401002 |authentication invalid error|无效身份信息|
// |401 |401003 |authorization token error|令牌字符为空|
// |401 |401004 |device fingerprint mismatch|设备指纹信息不匹配|
// |403 |403001 |permission error|权限未分配|
// |422 |422001 |params error|参数接收解析错误|
// |422 |422002 |params error|参数属性传入错误|

// ====== 500 ======

/**响应-code服务内部错误 */
export const CODE_INTERNAL = 500001;

/**响应-msg服务内部错误 */
export const MSG_INTERNAL = 'internal error';

// ====== 200 ======

/**响应-code加密数据 */
export const CODE_ENCRYPT = 200999;
/**响应-msg加密数据 */
export const MSG_ENCRYPT = 'encrypt';

/**响应-code正常成功 */
export const CODE_SUCCESS = 200001;
/**响应-msg正常成功 */
export const MSG_SUCCESS = 'success';

/**响应-code错误失败 */
export const CODE_ERROR = 400001;
/**响应-msg错误失败 */
export const MSG_ERROR = 'error';

/**响应-code错误失败 */
export const CODE_RATELIMIT = 400429;
/**响应-msg错误失败 */
export const MSG_RATELIMIT = 'access too often, please try again later';

// ====== 401 ======

/**响应-code身份认证失败或者过期 */
export const CODE_AUTH = 401001;

/**响应-code无效身份信息 */
export const CODE_AUTH_INVALID = 401002;

/**响应-code令牌字符为空 */
export const CODE_AUTH_NOTOKEN = 401003;

/**响应-code设备指纹信息不匹配 */
export const CODE_AUTH_DEVICE = 401004;
/**响应-msg设备指纹信息不匹配 */
export const MSG_AUTH_DEVICE = 'device fingerprint mismatch';

// ====== 403 ======

/**响应-code权限未分配 */
export const CODE_PERMISSION = 403001;

// ====== 422 ======

/**响应-code参数接收解析错误 */
export const CODE_PARAM_PARSER = 422001;
/**响应-code参数属性传入错误 */
export const CODE_PARAM_CHEACK = 422002;
