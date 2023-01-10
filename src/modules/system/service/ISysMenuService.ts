import { TreeSelect } from '../../../framework/model/TreeSelect';
import { SysMenu } from '../model/SysMenu';
import { RouterVo } from '../model/vo/RouterVo';

/**
 * 菜单 服务层接口
 *
 * @author TsMask
 */
export interface ISysMenuService {
  /**
   * 根据用户查询系统菜单列表
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
   * 根据角色ID查询权限
   *
   * @param roleId 角色ID
   * @return 权限列表
   */
  selectMenuPermsByRoleId(roleId: string): Promise<string[]>;

  /**
   * 根据用户ID查询菜单树信息
   *
   * @param userId 用户ID
   * @return 菜单列表
   */
  selectMenuTreeByUserId(userId: string): Promise<SysMenu[]>;

  /**
   * 查询菜单树结构信息
   * @param sysMenu 菜单信息
   * @param userId 用户ID null时是管理员显示所有菜单信息
   * @returns 菜单树信息集合
   */
  selectMenuTreeSelectByUserId(
    sysMenu: SysMenu,
    userId: string
  ): Promise<TreeSelect[]>;

  /**
   * 根据角色ID查询菜单树信息
   *
   * @param roleId 角色ID
   * @return 选中菜单列表
   */
  selectMenuListByRoleId(roleId: string): Promise<string[]>;

  /**
   * 构建前端路由所需要的菜单
   *
   * @param sysMenus 菜单列表
   * @return 路由列表
   */
  buildRouteMenus(sysMenus: SysMenu[]): Promise<RouterVo[]>;

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
   * @return 结果 true 存在 false 不存在
   */
  hasChildByMenuId(menuId: string): Promise<boolean>;

  /**
   * 查询菜单是否存在角色
   *
   * @param menuId 菜单ID
   * @return 结果 true 存在 false 不存在
   */
  checkMenuExistRole(menuId: string): Promise<boolean>;

  /**
   * 新增保存菜单信息
   *
   * @param sysMenu 菜单信息
   * @return 结果
   */
  insertMenu(sysMenu: SysMenu): Promise<string>;

  /**
   * 修改保存菜单信息
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
   * @param sysMenu 菜单信息
   * @return 结果
   */
  checkUniqueNenuName(sysMenu: SysMenu): Promise<boolean>;
}
