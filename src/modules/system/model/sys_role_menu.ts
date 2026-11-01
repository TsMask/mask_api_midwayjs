import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { PrimaryColumn, Entity } from 'typeorm';

/**角色和菜单关联表 */
@Entity('sys_role_menu')
export class SysRoleMenu {
  /**角色ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'role_id' })
  role_id: number;

  /**菜单ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'menu_id' })
  menu_id: number;
}
