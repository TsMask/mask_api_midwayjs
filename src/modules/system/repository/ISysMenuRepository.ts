import { SysMenu } from '../model/SysMenu';

/**
 * 菜单表 数据层接口
 *
 * @author TsMask
 */
export interface ISysMenuRepository {
  /**
   * 查询系统菜单列表
   *
   * @param sysMenu 菜单信息
   * @param userId 用户ID null时是管理员显示所有菜单信息
   * @return 菜单列表
   */
  selectMenuList(sysMenu: SysMenu, userId?: string): Promise<SysMenu[]>;

  /**
   * 根据用户所有权限
   *
   * @return 权限列表
   */
  selectMenuPerms(): Promise<number[]>;

  /**
   * 根据角色ID查询权限
   *
   * @param roleId 角色ID
   * @return 权限列表
   */
  selectMenuPermsByRoleId(roleId: string): Promise<string[]>;

  /**
   * 根据用户ID查询权限
   *
   * @param userId 用户ID
   * @return 权限列表
   */
  selectMenuPermsByUserId(userId: string): Promise<string[]>;

  /**
   * 根据用户ID查询菜单
   *
   * @param userId 用户ID
   * @return 菜单列表
   */
  selectMenuTreeByUserId(userId: string): Promise<SysMenu[]>;

  /**
   * 根据角色ID查询菜单树信息
   *
   * @param roleId 角色ID
   * @param menuCheckStrictly 菜单树选择项是否关联显示
   * @return 选中菜单列表
   */
  selectMenuListByRoleId(
    roleId: string,
    menuCheckStrictly: boolean
  ): Promise<string[]>;

  /**
   * 根据菜单ID查询信息
   *
   * @param menuId 菜单ID
   * @return 菜单信息
   */
  selectMenuById(menuId: string): Promise<SysMenu>;

  /**
   * 是否存在菜单子节点
   *
   * @param menuId 菜单ID
   * @return 结果
   */
  hasChildByMenuId(menuId: string): Promise<number>;

  /**
   * 查询菜单是否存在角色
   *
   * @param menuId 菜单ID
   * @return 结果
   */
  checkMenuExistRole(menuId: string): Promise<number>;

  /**
   * 新增菜单信息
   *
   * @param sysMenu 菜单信息
   * @return 结果
   */
  insertMenu(sysMenu: SysMenu): Promise<string>;

  /**
   * 修改菜单信息
   *
   * @param sysMenu 菜单信息
   * @return 结果
   */
  updateMenu(sysMenu: SysMenu): Promise<number>;

  /**
   * 删除菜单管理信息
   *
   * @param menuId 菜单ID
   * @return 结果
   */
  deleteMenuById(menuId: string): Promise<number>;

  /**
   * 校验菜单名称是否唯一
   *
   * @param menuName 菜单名称
   * @param parentId 父菜单ID
   * @return 结果
   */
  checkUniqueMenuName(menuName: string, parentId: string): Promise<string>;

  /**
   * 校验路由地址是否唯一（针对目录和菜单）
   *
   * @param path 路由地址
   * @return 结果
   */
  checkUniqueMenuPath(path: string): Promise<string>;
}
