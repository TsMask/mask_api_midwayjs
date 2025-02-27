import { Rule, RuleType } from '@midwayjs/validate';
import { PrimaryColumn, Entity } from 'typeorm';

/**用户与岗位关联表 */
@Entity('sys_user_post')
export class SysUserPost {
  /**用户ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  /**岗位ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryColumn({ name: 'post_id' })
  postId: number;
}
