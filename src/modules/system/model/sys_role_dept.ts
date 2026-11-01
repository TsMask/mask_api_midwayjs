import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { PrimaryColumn, Entity } from 'typeorm';

/**角色和部门关联表 */
@Entity('sys_role_dept')
export class SysRoleDept {
  /**角色ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'role_id' })
  role_id: number;

  /**部门ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'dept_id' })
  dept_id: number;
}
