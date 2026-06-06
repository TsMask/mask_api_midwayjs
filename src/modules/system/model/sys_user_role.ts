import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { PrimaryColumn, Entity } from 'typeorm';

/**用户和角色关联表 */
@Entity('sys_user_role')
export class SysUserRole {
  /**用户ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  /**角色ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;
}
