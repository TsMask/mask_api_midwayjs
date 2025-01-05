import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity } from 'typeorm';

/**用户和角色关联表 */
@Entity('sys_dict_type')
export class SysUserRole {
  /**用户ID */
  @Rule(RuleType.number())
  @Column({ name: 'user_id' })
  userId: number;

  /**角色ID */
  @Rule(RuleType.number())
  @Column({ name: 'role_id' })
  roleId: number;
}
