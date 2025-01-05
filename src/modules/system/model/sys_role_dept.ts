import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity } from 'typeorm';

/**角色和部门关联表 */
@Entity('sys_role_dept')
export class SysRoleDept {
  /**角色ID */
  @Rule(RuleType.number())
  @Column({ name: 'role_id' })
  roleId: number;

  /**部门ID */
  @Rule(RuleType.number())
  @Column({ name: 'dept_id' })
  deptId: number;
}
