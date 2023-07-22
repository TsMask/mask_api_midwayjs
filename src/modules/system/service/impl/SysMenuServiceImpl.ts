import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import {
  parseDataToTree,
  parseFirstUpper,
} from '../../../../framework/utils/ValueParseUtils';
import { validHttp } from '../../../../framework/utils/RegularUtils';
import { TreeSelect } from '../../../../framework/vo/TreeSelect';
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
  MENU_COMPONENT_LAYOUT_LINK,
  MENU_COMPONENT_LAYOUT_BASIC,
  MENU_COMPONENT_LAYOUT_BLANK,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
  MENU_PATH_INLINE,
} from '../../../../framework/constants/MenuConstants';
import { RouterVo } from '../../../../framework/vo/RouterVo';
import { RouterMateVo } from '../../../../framework/vo/RouterMateVo';

/**
 * 菜单 服务层实现
 *
 * @author TsMask
 */
@Provide()
@Singleton()
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
    if (!role) return [];
    return await this.sysMenuRepository.selectMenuListByRoleId(
      role.roleId,
      role.menuCheckStrictly === '1'
    );
  }

  async selectMenuById(menuId: string): Promise<SysMenu> {
    if (!menuId) return null;
    const menus = await this.sysMenuRepository.selectMenuByIds([menuId]);
    if (menus.length > 0) {
      return menus[0];
    }
    return null;
  }

  async hasChildByMenuId(menuId: string): Promise<number> {
    return await this.sysMenuRepository.hasChildByMenuId(menuId);
  }

  async checkMenuExistRole(menuId: string): Promise<number> {
    return await this.sysRoleMenuRepository.checkMenuExistRole(menuId);
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

  async checkUniqueNenuName(
    menuName: string,
    parentId: string,
    menuId: string = ''
  ): Promise<boolean> {
    const sysMenu = new SysMenu();
    sysMenu.menuName = menuName;
    sysMenu.parentId = parentId;
    const uniqueId = await this.sysMenuRepository.checkUniqueMenu(sysMenu);
    if (uniqueId === menuId) {
      return true;
    }
    return !uniqueId;
  }

  async checkUniqueNenuPath(
    path: string,
    menuId: string = ''
  ): Promise<boolean> {
    const sysMenu = new SysMenu();
    sysMenu.path = path;
    const uniqueId = await this.sysMenuRepository.checkUniqueMenu(sysMenu);
    if (uniqueId === menuId) {
      return true;
    }
    return !uniqueId;
  }

  async buildRouteMenus(sysMenus: SysMenu[], prefix = ''): Promise<RouterVo[]> {
    const routers: RouterVo[] = [];
    for (const menu of sysMenus) {
      const router = new RouterVo();
      router.name = this.getRouteName(menu);
      router.path = this.getRouterPath(menu);
      router.component = this.getComponent(menu);
      router.meta = this.getRouteMeta(menu);

      // 非路径链接 子项菜单目录
      const cMenus = menu.children;
      if (
        cMenus &&
        cMenus.length > 0 &&
        !validHttp(menu.path) &&
        menu.menuType === MENU_TYPE_DIR
      ) {
        // 获取重定向地址
        const { redirectPrefix, redirectPath } = this.getRouteRedirect(
          cMenus,
          router.path,
          prefix
        );
        router.redirect = redirectPath;
        // 子菜单进入递归
        router.children = await this.buildRouteMenus(cMenus, redirectPrefix);
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
    const routerName = parseFirstUpper(menu.path);
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
      return MENU_COMPONENT_LAYOUT_LINK;
    }

    // 非父菜单 目录类型
    if (menu.parentId !== '0' && menu.menuType === MENU_TYPE_DIR) {
      return MENU_COMPONENT_LAYOUT_BLANK;
    }

    // 菜单类型 内部跳转 有组件路径
    if (
      menu.menuType === MENU_TYPE_MENU &&
      menu.isFrame === STATUS_YES &&
      menu.component
    ) {
      return menu.component;
    }

    return MENU_COMPONENT_LAYOUT_BASIC;
  }

  /**
   * 获取路由元信息
   *
   * @param menu 菜单信息
   * @return 元信息
   */
  private getRouteMeta(menu: SysMenu): RouterMateVo {
    const meta = new RouterMateVo();
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

  /**
   * 获取路由重定向地址（针对目录）
   *
   * @param cMenus 子菜单数组
   * @param routerPath 当期菜单路径
   * @param prefix 菜单重定向路径前缀
   * @return 重定向地址和前缀
   */
  private getRouteRedirect(
    cMenus: SysMenu[],
    routerPath: string,
    prefix: string
  ): {
    redirectPrefix: string;
    redirectPath: string;
  } {
    let redirectPath = '';

    // 重定向为首个显示并启用的子菜单
    let firstChild = cMenus.find(
      item => item.isFrame === STATUS_YES && item.visible === STATUS_YES
    );
    // 检查内嵌隐藏菜单是否可做重定向
    if (!firstChild) {
      firstChild = cMenus.find(
        item =>
          item.isFrame === STATUS_YES &&
          item.visible === STATUS_NO &&
          item.path.includes(MENU_PATH_INLINE)
      );
    }
    if (firstChild) {
      const firstChildPath = this.getRouterPath(firstChild);
      if (firstChildPath.startsWith('/')) {
        redirectPath = firstChildPath;
      } else {
        // 拼接追加路径
        if (!routerPath.startsWith('/')) {
          prefix += '/';
        }
        prefix = `${prefix}${routerPath}`;
        redirectPath = `${prefix}/${firstChildPath}`;
      }
    }
    return { redirectPrefix: prefix, redirectPath };
  }
}
