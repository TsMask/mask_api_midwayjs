/**
 * 部门表 sys_dept
 *
 * @author TsMask
 */
export class SysDept {
  /**部门id */
  deptId: string;

  /**父部门id */
  parentId: string;

  /**祖级列表 */
  ancestors: string;

  /**部门名称 */
  deptName: string;

  /**显示顺序 */
  orderNum: number;

  /**负责人 */
  leader: string;

  /**联系电话 */
  phone: string;

  /**邮箱 */
  email: string;

  /**部门状态（0正常 1停用） */
  status: string;

  /**删除标志（0代表存在 2代表删除） */
  delFlag: string;

  /**创建者 */
  createBy: string;

  /**创建时间 */
  createTime: number;

  /**更新者 */
  updateBy: string;

  /**更新时间 */
  updateTime: number;

  // ====== 非数据库字段属性 ======

  /**子部门 */
  children: SysDept[];
}
