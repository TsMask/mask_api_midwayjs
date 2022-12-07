import { SysDept } from './SysDept';
import { SysRole } from './SysRole';

/**
 * 用户对象 sys_user
 *
 * @author TsMask <340112800@qq.com>
 */
export class SysUser {
  /**用户ID */
  userId: string;

  /**部门ID */
  deptId: string;

  /**用户账号 */
  userName: string;

  /**用户昵称 */
  nickName: string;

  /**用户类型（00系统用户） */
  userType: string;

  /**用户邮箱 */
  email: string;

  /**手机号码 */
  phonenumber: string;

  /**用户性别（0未知 1男 2女） */
  sex: string;

  /**头像地址 */
  avatar: string;

  /**密码 */
  password: string;

  /**帐号状态（0正常 1停用） */
  status: string;

  /**删除标志（0代表存在 1代表停用 2代表删除） */
  delFlag: string;

  /**最后登录IP */
  loginIp: string;

  /**最后登录时间 */
  loginDate: number;

  /**创建者 */
  createBy: string;

  /**创建时间 */
  createTime: number;

  /**更新者 */
  updateBy: string;

  /**更新时间 */
  updateTime: number;

  /**备注 */
  remark: string;

  // ====== 非数据库字段属性 ======

  /**部门对象 */
  dept: SysDept;

  /**角色对象组 */
  roles: SysRole[];

  /**角色ID */
  roleId: string;

  /**角色组 */
  roleIds: string[];

  /**岗位组 */
  postIds: string[];
}
