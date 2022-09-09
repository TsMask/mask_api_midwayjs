import { Entity, Column } from 'typeorm';

/**
 * 角色和部门关联 sys_role_dept
 *
 * @author TsMask <340112800@qq.com>
 */
@Entity('sys_role_dept')
export class SysRoleDept {
  /**角色ID */
  @Column('bigint', { primary: true, name: 'role_id', comment: '角色ID' })
  role_id: string;

  /**部门ID */
  @Column('bigint', { primary: true, name: 'dept_id', comment: '部门ID' })
  dept_id: string;
}
