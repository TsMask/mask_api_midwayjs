import { Rule, RuleType } from '@midwayjs/validate';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SysDept } from './sys_dept';
import { SysRole } from './sys_role';

/**用户信息表 */
@Entity('sys_user')
export class SysUser {
  /**用户ID */
  @Rule(RuleType.number().allow(0))
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  /**部门ID */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'dept_id' })
  deptId: number;

  /**用户账号 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'user_name' })
  userName: string;

  /**用户邮箱 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'email' })
  email: string;

  /**手机号码 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'phone' })
  phone: string;

  /**用户昵称 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'nick_name' })
  nickName: string;

  /**用户性别（0未知 1男 2女） */
  @Rule(RuleType.string().pattern(/^[012]$/))
  @Column({ name: 'sex' })
  sex: string;

  /**头像地址 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'avatar' })
  avatar: string;

  /**密码 */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'password' })
  password: string;

  /**帐号状态（0停用 1正常） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'status_flag' })
  statusFlag: string;

  /**删除标志（0代表存在 1代表删除） */
  @Rule(RuleType.string().pattern(/^[01]$/))
  @Column({ name: 'del_flag' })
  delFlag: string;

  /**最后登录IP */
  @Rule(RuleType.string().allow(''))
  @Column({ name: 'login_ip' })
  loginIp: string;

  /**最后登录时间 */
  @Rule(RuleType.number().allow(0))
  @Column({ name: 'login_time' })
  loginTime: number;

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

  /**部门对象 */
  dept: SysDept;

  /**角色对象组 */
  roles: SysRole[];

  /**角色ID */
  roleId: string;

  /**角色组 */
  roleIds: number[];

  /**岗位组 */
  postIds: number[];
}
