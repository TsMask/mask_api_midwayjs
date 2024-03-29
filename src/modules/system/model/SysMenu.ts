/**
 * 菜单权限表 sys_menu
 *
 * @author TsMask
 */
export class SysMenu {
  /**菜单ID */
  menuId: string;

  /**菜单名称 */
  menuName: string;

  /**父菜单ID 默认0 */
  parentId: string;

  /**显示顺序 */
  menuSort: number;

  /**路由地址 */
  path: string;

  /**组件路径 */
  component: string;

  /**是否内部跳转（0否 1是） */
  isFrame: string;

  /**是否缓存（0不缓存 1缓存） */
  isCache: string;

  /**菜单类型（D目录 M菜单 B按钮） */
  menuType: string;

  /**是否显示（0隐藏 1显示） */
  visible: string;

  /**菜单状态（0停用 1正常） */
  status: string;

  /**权限标识 */
  perms: string;

  /**菜单图标（#无图标） */
  icon: string;

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

  /**子菜单 */
  children: SysMenu[];
}
