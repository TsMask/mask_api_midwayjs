import { Rule, RuleType } from '@midwayjs/validate';
import { PrimaryColumn, Entity } from 'typeorm';

/**角色和部门关联表 */
@Entity('sys_role_dept')
export class SysRoleDept {
  /**角色ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  /**部门ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryColumn({ name: 'dept_id' })
  deptId: number;
}
