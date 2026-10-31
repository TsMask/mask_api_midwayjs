import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';

/**手机号验证码登录对象 */
export class LoginPhoneBody {
  @Rule(Joi.string().required().pattern(/^1[3-9]\d{9}$/))
  phone: string;

  @Rule(Joi.string().required().length(6))
  code: string;

  @Rule(Joi.string().required().length(32))
  uuid: string;
}
