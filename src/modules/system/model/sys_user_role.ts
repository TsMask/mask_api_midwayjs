import { Entity, Column } from 'typeorm';

/**
 * 用户和角色关联 sys_user_role
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_user_role')
export class SysUserRole {
  /**用户ID */
  @Column('bigint', { primary: true, name: 'user_id', comment: '用户ID' })
  user_id: string;

  /**角色ID */
  @Column('bigint', { primary: true, name: 'role_id', comment: '角色ID' })
  role_id: string;
}
