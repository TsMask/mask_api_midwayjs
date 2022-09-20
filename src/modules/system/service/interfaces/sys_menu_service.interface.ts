import { SysMenu } from '../../../../framework/core/model/sys_menu';
import { TreeSelect } from '../../../../framework/core/tree_select';
import { RouterVo } from '../../model/vo/router_vo';

/**
 * 菜单 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface SysMenuServiceInterface {
  /**
   * 根据用户查询系统菜单列表
   *
   * @param user_Id 用户ID
   * @return 菜单列表
   */
  select_menu_list(user_Id: string): Promise<SysMenu[]>;

  /**
   * 根据用户查询系统菜单列表
   *
   * @param sys_menu 菜单信息
   * @param user_Id 用户ID
   * @return 菜单列表
   */
  select_menu_list(sys_menu: SysMenu, user_Id: string): Promise<SysMenu[]>;

  /**
   * 根据用户ID查询权限
   *
   * @param user_Id 用户ID
   * @return 权限列表
   */
  select_menu_perms_by_user_id(user_Id: string): Promise<string[]>;

  /**
   * 根据角色ID查询权限
   *
   * @param role_id 角色ID
   * @return 权限列表
   */
  select_menu_perms_by_role_id(role_id: string): Promise<string[]>;

  /**
   * 根据用户ID查询菜单树信息
   *
   * @param user_Id 用户ID
   * @return 菜单列表
   */
  select_menu_tree_by_user_id(user_Id: string): Promise<SysMenu[]>;

  /**
   * 根据角色ID查询菜单树信息
   *
   * @param role_id 角色ID
   * @return 选中菜单列表
   */
  select_menu_list_by_role_id(role_id: string): Promise<string[]>;

  /**
   * 构建前端路由所需要的菜单
   *
   * @param sys_menus 菜单列表
   * @return 路由列表
   */
  build_menus(sys_menus: SysMenu[]): Promise<RouterVo[]>;

  /**
   * 构建前端所需要树结构
   *
   * @param sys_menus 菜单列表
   * @return 树结构列表
   */
  build_menu_tree(sys_menus: SysMenu[]): Promise<SysMenu[]>;

  /**
   * 构建前端所需要下拉树结构
   *
   * @param sys_menus 菜单列表
   * @return 下拉树结构列表
   */
  buildMenuTreeSelect(sys_menus: SysMenu[]): Promise<TreeSelect[]>;

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
   * @return 结果 true 存在 false 不存在
   */
  has_child_by_menu_id(menu_id: string): Promise<boolean>;

  /**
   * 查询菜单是否存在角色
   *
   * @param menu_id 菜单ID
   * @return 结果 true 存在 false 不存在
   */
  check_menu_exist_role(menu_id: string): Promise<boolean>;

  /**
   * 新增保存菜单信息
   *
   * @param sys_menu 菜单信息
   * @return 结果
   */
  insert_menu(sys_menu: SysMenu): Promise<number>;

  /**
   * 修改保存菜单信息
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
   * @return 结果
   */
  check_unique_menu_name(menu_name: string): Promise<SysMenu>;
}
