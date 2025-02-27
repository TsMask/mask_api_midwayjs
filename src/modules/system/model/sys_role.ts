import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**角色表 */
@Entity('sys_role')
export class SysRole {
  /**角色ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'role_id' })
  roleId: number;

  /**角色名称 */
  @Rule(RuleType.string().required())
  @Column({ name: 'role_name' })
  roleName: string;

  /**角色键值 */
  @Rule(RuleType.string().required())
  @Column({ name: 'role_key' })
  roleKey: string;

  /**显示顺序 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'role_sort' })
  roleSort: number;

  /**数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限 5：仅本人数据权限） */
  @Rule(RuleType.string().pattern(/^[12345]$/))
  @Column({ name: 'data_scope' })
  dataScope: string;

  /**菜单树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'menu_check_strictly' })
  menuCheckStrictly: string;

  /**部门树选择项是否关联显示（0：父子不互相关联显示 1：父子互相关联显示）*/
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'dept_check_strictly' })
  deptCheckStrictly: string;

  /**角色状态（0停用 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**删除标志（0代表存在 1代表删除） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'del_flag' })
  delFlag: string;

  /**创建者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'create_by' })
  createBy: string;

  /**创建时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'create_time' })
  createTime: number;

  /**更新者 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'update_by' })
  updateBy: string;

  /**更新时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'update_time' })
  updateTime: number;

  /**备注 */
  @Rule(RuleType.string().allow(''))
  @Column({
    length: 200,
    name: 'remark',
  })
  remark: string;

  // ====== 非数据库字段属性 ======

  /**菜单组 */
  menuIds: number[];

  /**部门组（数据权限） */
  deptIds: number[];
}
