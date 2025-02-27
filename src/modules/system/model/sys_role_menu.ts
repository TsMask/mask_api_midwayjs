import { Rule, RuleType } from '@midwayjs/validate';
import { PrimaryColumn, Entity } from 'typeorm';

/**角色和菜单关联表 */
@Entity('sys_role_menu')
export class SysRoleMenu {
  /**角色ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  /**菜单ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryColumn({ name: 'menu_id' })
  menuId: number;
}
