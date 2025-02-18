import { Rule, RuleType } from '@midwayjs/validate';
import { PrimaryColumn, Entity } from 'typeorm';

/**用户和角色关联表 */
@Entity('sys_dict_type')
export class SysUserRole {
  /**用户ID */
  @Rule(RuleType.number())
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  /**角色ID */
  @Rule(RuleType.number())
  @PrimaryColumn({ name: 'role_id' })
  roleId: number;
}
