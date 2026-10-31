import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';

/**手机号验证码注册对象 */
export class RegisterPhoneBody {
  @Rule(Joi.string().required().pattern(/^1[3-9]\d{9}$/))
  phone: string;

  @Rule(Joi.string().required().length(6))
  code: string;

  @Rule(Joi.string().required().length(32))
  uuid: string;
}
