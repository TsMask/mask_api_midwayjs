import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity } from 'typeorm';

/**用户与岗位关联表 */
@Entity('sys_user_post')
export class SysUserPost {
  /**用户ID */
  @Rule(RuleType.number())
  @Column({ name: 'user_id' })
  userId: number;

  /**岗位ID */
  @Rule(RuleType.number())
  @Column({ name: 'post_id' })
  postId: number;
}
