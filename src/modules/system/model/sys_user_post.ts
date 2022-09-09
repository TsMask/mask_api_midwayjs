import { Entity, Column } from 'typeorm';

/**
 * 用户和岗位关联 sys_user_post
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_user_post')
export class SysUserPost {
  /**用户ID */
  @Column('bigint', { primary: true, name: 'user_id', comment: '用户ID' })
  user_id: string;

  /**岗位ID */
  @Column('bigint', { primary: true, name: 'post_id', comment: '岗位ID' })
  post_id: string;
}
