import { SysMenu } from '../../../../common/core/model/sys_menu';

/**
 * 菜单表 数据层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysMenuRepoInterface {
  /**
   * 查询系统菜单列表
   *
   * @param sys_menu 菜单信息
   * @return 菜单列表
   */
  select_menu_list(sys_menu: SysMenu): Promise<SysMenu[]>;

  /**
   * 根据用户所有权限
   *
   * @return 权限列表
   */
  select_menu_perms(): Promise<string[]>;

  /**
   * 根据用户查询系统菜单列表
   *
   * @param sys_menu 菜单信息
   * @return 菜单列表
   */
  select_menu_list_by_user_id(sys_menu: SysMenu): Promise<SysMenu[]>;

  /**
   * 根据角色ID查询权限
   *
   * @param role_id 角色ID
   * @return 权限列表
   */
  select_menu_perms_by_role_id(role_id: string): Promise<string[]>;

  /**
   * 根据用户ID查询权限
   *
   * @param user_id 用户ID
   * @return 权限列表
   */
  select_menu_perms_by_user_id(user_id: string): Promise<string[]>;

  /**
   * 根据用户ID查询菜单
   *
   * @return 菜单列表
   */
  select_menu_tree_all(): Promise<SysMenu>;

  /**
   * 根据用户ID查询菜单
   *
   * @param user_id 用户ID
   * @return 菜单列表
   */
  select_menu_tree_by_user_id(user_id: string): Promise<SysMenu[]>;

  /**
   * 根据角色ID查询菜单树信息
   *
   * @param role_id 角色ID
   * @param menu_check_strictly 菜单树选择项是否关联显示
   * @return 选中菜单列表
   */
  select_menu_list_by_role_id(
    role_id: string,
    menu_check_strictly: boolean
  ): Promise<string[]>;

  /**
   * 根据菜单ID查询信息
   *
   * @param menu_id 菜单ID
   * @return 菜单信息
   */
  select_menu_by_id(menu_id: string): Promise<SysMenu>;

  /**
   * 是否存在菜单子节点
   *
   * @param menu_id 菜单ID
   * @return 结果
   */
  has_child_by_menu_id(menu_id: string): Promise<number>;

  /**
   * 新增菜单信息
   *
   * @param sys_menu 菜单信息
   * @return 结果
   */
  insert_menu(sys_menu: SysMenu): Promise<number>;

  /**
   * 修改菜单信息
   *
   * @param sys_menu 菜单信息
   * @return 结果
   */
  update_menu(sys_menu: SysMenu): Promise<number>;

  /**
   * 删除菜单管理信息
   *
   * @param menu_id 菜单ID
   * @return 结果
   */
  delete_menu_by_id(menu_id: string): Promise<number>;

  /**
   * 校验菜单名称是否唯一
   *
   * @param menu_name 菜单名称
   * @param parent_id 父菜单ID
   * @return 结果
   */
  check_unique_menu_name(
    menu_name: string,
    parent_id: string
  ): Promise<SysMenu>;
}
