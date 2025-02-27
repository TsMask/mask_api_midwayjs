import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**部门表 */
@Entity('sys_dept')
export class SysDept {
  /**部门ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'dept_id' })
  deptId: number;

  /**父部门ID */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'parent_id' })
  parentId: number;

  /**祖级列表 */
  @Rule(RuleType.string().allow(''))
  @Column({
    type: 'varchar',
    name: 'ancestors',
  })
  ancestors: string;

  /**部门名称 */
  @Rule(RuleType.string().required())
  @Column({ name: 'dept_name' })
  deptName: string;

  /**显示顺序 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'dept_sort' })
  deptSort: number;

  /**负责人 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'leader' })
  leader: string;

  /**联系电话 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'phone' })
  phone: string;

  /**邮箱 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'email' })
  email: string;

  /**部门状态（0正常 1停用） */
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

  // ====== 非数据库字段属性 ======

  /**子部门 */
  children: SysDept[];
}
