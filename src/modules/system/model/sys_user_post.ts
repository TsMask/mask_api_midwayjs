import { Rule } from '@midwayjs/validation';
import * as Joi from 'joi';
import { PrimaryColumn, Entity } from 'typeorm';

/**用户与岗位关联表 */
@Entity('sys_user_post')
export class SysUserPost {
  /**用户ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  /**岗位ID */
  @Rule(Joi.number().allow(0))
  @PrimaryColumn({ name: 'post_id' })
  postId: number;
}
