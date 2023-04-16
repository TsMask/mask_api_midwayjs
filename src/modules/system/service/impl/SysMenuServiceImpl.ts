import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import {
  parseDataToTree,
  parseFirstUpper,
} from '../../../../framework/utils/ValueParseUtils';
import { validHttp } from '../../../../framework/utils/RegularUtils';
import { TreeSelect } from '../../../../framework/model/TreeSelect';
import { MetaVo } from '../../model/vo/MetaVo';
import { RouterVo } from '../../model/vo/RouterVo';
import { SysMenuRepositoryImpl } from '../../repository/impl/SysMenuRepositoryImpl';
import { ISysMenuService } from '../ISysMenuService';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { SysRoleMenuRepositoryImpl } from '../../repository/impl/SysRoleMenuRepositoryImpl';
import { SysMenu } from '../../model/SysMenu';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../../framework/constants/CommonConstants';
import {
  MENU_COMPONENT_LINK_LAYOUT,
  MENU_COMPONENT_BASIC_LAYOUT,
  MENU_COMPONENT_BLANK_LAYOUT,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../../framework/constants/MenuConstants';

/**
 * 菜单 服务层实现
 *
 * @author TsMask
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysMenuServiceImpl implements ISysMenuService {
  @Inject()
  private sysMenuRepository: SysMenuRepositoryImpl;

  @Inject()
  private sysRoleRepository: SysRoleRepositoryImpl;

  @Inject()
  private sysRoleMenuRepository: SysRoleMenuRepositoryImpl;

  async selectMenuList(sysMenu: SysMenu, userId?: string): Promise<SysMenu[]> {
    return await this.sysMenuRepository.selectMenuList(sysMenu, userId);
  }

  async selectMenuPermsByUserId(userId: string): Promise<string[]> {
    const perms = await this.sysMenuRepository.selectMenuPermsByUserId(userId);
    const permsArr: string[] = [];
    for (const perm of perms) {
      if (perm) {
        permsArr.push(...perm.split(','));
      }
    }
    return [...new Set(permsArr)];
  }

  async selectMenuPermsByRoleId(roleId: string): Promise<string[]> {
    const perms = await this.sysMenuRepository.selectMenuPermsByRoleId(roleId);
    const permsArr: string[] = [];
    for (const perm of perms) {
      if (perm) {
        permsArr.push(...perm.split(','));
      }
    }
    return [...new Set(permsArr)];
  }

  async selectMenuTreeByUserId(userId: string): Promise<SysMenu[]> {
    const menus = await this.sysMenuRepository.selectMenuTreeByUserId(userId);
    return parseDataToTree<SysMenu>(menus, 'menuId');
  }

  async selectMenuTreeSelectByUserId(
    sysMenu: SysMenu,
    userId: string
  ): Promise<TreeSelect[]> {
    const menus = await this.sysMenuRepository.selectMenuList(sysMenu, userId);
    // 构建前端所需要下拉树结构
    const menuTrees: SysMenu[] = parseDataToTree<SysMenu>(menus, 'menuId');
    return menuTrees.map(menu => new TreeSelect().parseSysMenu(menu));
  }

  async selectMenuListByRoleId(roleId: string): Promise<string[]> {
    const role = await this.sysRoleRepository.selectRoleById(roleId);
    return await this.sysMenuRepository.selectMenuListByRoleId(
      role.roleId,
      role.menuCheckStrictly === '1'
    );
  }

  async selectMenuById(menuId: string): Promise<SysMenu> {
    return await this.sysMenuRepository.selectMenuById(menuId);
  }

  async hasChildByMenuId(menuId: string): Promise<boolean> {
    return (await this.sysMenuRepository.hasChildByMenuId(menuId)) > 0;
  }

  async checkMenuExistRole(menuId: string): Promise<boolean> {
    return (await this.sysRoleMenuRepository.checkMenuExistRole(menuId)) > 0;
  }

  async insertMenu(sysMenu: SysMenu): Promise<string> {
    return await this.sysMenuRepository.insertMenu(sysMenu);
  }

  async updateMenu(sysMenu: SysMenu): Promise<number> {
    return await this.sysMenuRepository.updateMenu(sysMenu);
  }

  async deleteMenuById(menuId: string): Promise<number> {
    return await this.sysMenuRepository.deleteMenuById(menuId);
  }

  async checkUniqueNenuName(sysMenu: SysMenu): Promise<boolean> {
    const menuId = await this.sysMenuRepository.checkUniqueMenuName(
      sysMenu.menuName,
      sysMenu.parentId
    );
    // 菜单信息与查询得到菜单ID一致
    if (menuId && sysMenu.menuId === menuId) {
      return true;
    }
    return !menuId;
  }

  async buildRouteMenus(
    sysMenus: SysMenu[],
    prefix: string = ''
  ): Promise<RouterVo[]> {
    const routers: RouterVo[] = [];
    for (const menu of sysMenus) {
      const router = new RouterVo();
      router.name = this.getRouteName(menu);
      router.path = this.getRouterPath(menu);
      router.component = this.getComponent(menu);
      router.meta = this.getRouteMeta(menu);

      // 子项菜单目录
      const cMenus = menu.children;
      if (menu.menuType === MENU_TYPE_DIR && cMenus && cMenus.length > 0) {
        // 重定向为首个显示并启用的子菜单
        const firstChild = cMenus.find(
          item =>
            item.isFrame === STATUS_YES &&
            item.visible === STATUS_YES &&
            item.status === STATUS_YES
        );
        if (firstChild) {
          if (firstChild.path.startsWith('/')) {
            router.redirect = firstChild.path;
          } else {
            if (!router.path.startsWith('/')) {
              prefix += '/';
            }
            prefix = `${prefix}${router.path}`;
            router.redirect = `${prefix}/${firstChild.path}`;
          }
        }
        // 子菜单进入递归
        router.children = await this.buildRouteMenus(cMenus, prefix);
        prefix = '';
      }
      routers.push(router);
    }
    return routers;
  }

  /**
   * 获取路由名称
   *
   * 路径英文首字母大写
   *
   * @param menu 菜单信息
   * @return 路由名称
   */
  private getRouteName(menu: SysMenu): string {
    let routerName = parseFirstUpper(menu.path);
    // 路径链接
    if (validHttp(menu.path)) {
      return `${routerName.substring(0, 5)}Link${menu.menuId}`;
    }
    return routerName;
  }

  /**
   * 获取路由地址
   *
   * @param menu 菜单信息
   * @return 路由地址
   */
  private getRouterPath(menu: SysMenu): string {
    let routerPath = `${menu.path}`;

    // 显式路径
    if (routerPath.startsWith('/')) {
      return routerPath;
    }

    // 路径链接
    if (validHttp(routerPath)) {
      // 内部跳转 非父菜单 目录类型或菜单类型
      if (
        menu.isFrame === STATUS_YES &&
        menu.parentId !== '0' &&
        [MENU_TYPE_DIR, MENU_TYPE_MENU].includes(menu.menuType)
      ) {
        routerPath = routerPath.replace(/^http(s)?:\/\/+/, '');
        return Buffer.from(routerPath, 'utf8').toString('base64');
      }
      // 非内部跳转
      return routerPath;
    }

    // 父菜单 目录类型或菜单类型
    if (
      menu.parentId === '0' &&
      [MENU_TYPE_DIR, MENU_TYPE_MENU].includes(menu.menuType)
    ) {
      routerPath = `/${routerPath}`;
    }

    return routerPath;
  }

  /**
   * 获取组件信息
   *
   * @param menu 菜单信息
   * @return 组件信息
   */
  private getComponent(menu: SysMenu): string {
    // 路径链接 非父菜单 目录类型或菜单类型
    if (
      validHttp(menu.path) &&
      menu.parentId !== '0' &&
      [MENU_TYPE_DIR, MENU_TYPE_MENU].includes(menu.menuType)
    ) {
      return MENU_COMPONENT_LINK_LAYOUT;
    }

    // 非父菜单 目录类型
    if (menu.parentId !== '0' && menu.menuType === MENU_TYPE_DIR) {
      return MENU_COMPONENT_BLANK_LAYOUT;
    }

    // 菜单类型 内部跳转 有组件路径
    if (
      menu.menuType === MENU_TYPE_MENU &&
      menu.isFrame === STATUS_YES &&
      menu.component
    ) {
      return menu.component;
    }

    return MENU_COMPONENT_BASIC_LAYOUT;
  }

  /**
   * 获取路由元信息
   *
   * @param menu 菜单信息
   * @return 元信息
   */
  private getRouteMeta(menu: SysMenu): MetaVo {
    const meta = new MetaVo();
    meta.icon = menu.icon === '#' ? '' : menu.icon;
    meta.title = menu.menuName;
    meta.hide = menu.visible === STATUS_NO;
    meta.cache = menu.isCache === STATUS_YES;
    meta.target = null;

    // 路径链接
    if (validHttp(menu.path)) {
      // 内部跳转 父菜单 目录类型或菜单类型
      if (
        menu.isFrame === STATUS_YES &&
        menu.parentId === '0' &&
        [MENU_TYPE_DIR, MENU_TYPE_MENU].includes(menu.menuType)
      ) {
        meta.target = '_self';
      }
      // 非内部跳转
      if (menu.isFrame === STATUS_NO) {
        meta.target = '_blank';
      }
    }

    return meta;
  }
}
