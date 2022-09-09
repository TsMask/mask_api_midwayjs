import { SysRoleMenu } from '../../model/sys_role_menu';

/**
 * 角色与菜单关联表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysRoleMenuRepoInterface {
  /**
   * 查询菜单使用数量
   *
   * @param menu_id 菜单ID
   * @return 结果
   */
  check_menu_exist_role(menu_id: string): Promise<number>;

  /**
   * 通过角色ID删除角色和菜单关联
   *
   * @param role_id 角色ID
   * @return 结果
   */
  delete_role_menu_by_role_id(role_id: string): Promise<number>;

  /**
   * 批量删除角色菜单关联信息
   *
   * @param ids 需要删除的数据ID
   * @return 结果
   */
  delete_role_menu(ids: string[]): Promise<number>;

  /**
   * 批量新增角色菜单信息
   *
   * @param sys_role_menu_list 角色菜单列表
   * @return 结果
   */
  batch_role_menu(sys_role_menu_list: SysRoleMenu[]): Promise<number>;
}
