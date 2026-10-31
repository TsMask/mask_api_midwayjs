import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';

/**重置登录密码对象 */
export class PasswordResetBody {
  @Rule(Joi.string().required().min(4).max(26))
  username: string;

  @Rule(Joi.string().required().length(6))
  code: string;

  @Rule(Joi.string().required().length(32))
  uuid: string;

  @Rule(Joi.string().required().min(6).max(26))
  password: string;

  @Rule(Joi.string().required().min(6).max(26))
  confirm_password: string;
}
