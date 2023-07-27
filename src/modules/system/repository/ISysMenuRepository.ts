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
   * @param menuIds 菜单ID
   * @return 菜单信息
   */
  selectMenuByIds(menuIds: string[]): Promise<SysMenu[]>

  /**
   * 存在菜单子节点数量
   *
   * @param menuId 菜单ID
   * @return 结果
   */
  hasChildByMenuId(menuId: string): Promise<number>;

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
   * 校验菜单是否唯一
   *
   * @param sysMenu 菜单信息
   */
  checkUniqueMenu(sysMenu: SysMenu): Promise<string>;
}
