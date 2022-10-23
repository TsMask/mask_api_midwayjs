import { SysMenu } from '../../../framework/core/model/SysMenu';
import { TreeSelect } from '../../../framework/core/TreeSelect';
import { RouterVo } from '../model/vo/RouterVo';

/**
 * 菜单 服务层接口
 *
 * @author TsMask <340112800@qq.com>
 */
export interface ISysMenuService {
  /**
   * 根据用户查询系统菜单列表
   *
   * @param sysMenu 菜单信息
   * @param userId 用户ID
   * @return 菜单列表
   */
  selectMenuList(sysMenu: SysMenu, userId: string): Promise<SysMenu[]>;

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
  buildMenus(sysMenus: SysMenu[]): Promise<RouterVo[]>;

  /**
   * 构建前端所需要树结构
   *
   * @param sysMenus 菜单列表
   * @return 树结构列表
   */
  buildMenuTree(sysMenus: SysMenu[]): Promise<SysMenu[]>;

  /**
   * 构建前端所需要下拉树结构
   *
   * @param sysMenus 菜单列表
   * @return 下拉树结构列表
   */
  buildMenuTreeSelect(sysMenus: SysMenu[]): Promise<TreeSelect[]>;

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
  insertMenu(sysMenu: SysMenu): Promise<number>;

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
   * @param menuName 菜单名称
   * @return 结果
   */
  checkUniqueNenuName(menuName: string): Promise<SysMenu>;
}
