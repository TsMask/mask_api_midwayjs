import { METHOD_KEY_OPER_LOG, OpLerateLogSave } from './OperateLogMethodDecorator';
import {
  METHOD_KEY_PRE_AUTHORIZE,
  PreAuthorizeVerify,
} from './PreAuthorizeMethodDecorator';
import {
  METHOD_KEY_RATE_LIMIT,
  RateLimitVerify,
} from './RateLimitMethodDecorator';
import {
  METHOD_KEY_REPEAT_SUBMIT,
  RepeatSubmitVerify,
} from './RepeatSubmitMethodDecorator';

/**方法装饰器 */
export const MethodDecorators = [
  { key: METHOD_KEY_PRE_AUTHORIZE, fn: PreAuthorizeVerify },
  { key: METHOD_KEY_OPER_LOG, fn: OpLerateLogSave },
  { key: METHOD_KEY_RATE_LIMIT, fn: RateLimitVerify },
  { key: METHOD_KEY_REPEAT_SUBMIT, fn: RepeatSubmitVerify },
];
