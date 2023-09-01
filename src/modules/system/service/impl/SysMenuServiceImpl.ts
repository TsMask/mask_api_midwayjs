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
    return [...new Set(perms)];
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
    const roles = await this.sysRoleRepository.selectRoleByIds([roleId]);
    if (Array.isArray(roles) && roles.length === 0) return [];
    const role = roles[0];
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

  async hasChildByMenuIdAndStatus(
    menuId: string,
    status: string
  ): Promise<number> {
    return await this.sysMenuRepository.hasChildByMenuIdAndStatus(menuId, status);
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
    for (const item of sysMenus) {
      const router = new RouterVo();
      router.name = this.getRouteName(item);
      router.path = this.getRouterPath(item);
      router.component = this.getComponent(item);
      router.meta = this.getRouteMeta(item);

      // 子项菜单 目录类型 非路径链接
      const cMenus = item.children;
      if (
        cMenus &&
        cMenus.length > 0 &&
        item.menuType === MENU_TYPE_DIR &&
        !validHttp(item.path)
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
      } else if (
        item.parentId === '0' &&
        item.isFrame === STATUS_YES &&
        item.menuType === MENU_TYPE_MENU
      ) {
        // 父菜单 内部跳转 菜单类型
        const menuPath = '/' + item.menuId;
        const childPath = menuPath + this.getRouterPath(item);
        const children = new RouterVo();
        children.name = this.getRouteName(item);
        children.path = childPath;
        children.component = item.component;
        children.meta = this.getRouteMeta(item);
        router.meta.hideChildInMenu = true;
        router.children = [children];
        router.name = item.menuId;
        router.path = menuPath;
        router.redirect = childPath;
        router.component = MENU_COMPONENT_LAYOUT_BASIC;
      } else if (
        item.parentId === '0' &&
        item.isFrame === STATUS_YES &&
        validHttp(item.path)
      ) {
        // 父菜单 内部跳转 路径链接
        const menuPath = '/' + item.menuId;
        const childPath = menuPath + this.getRouterPath(item);
        const children = new RouterVo();
        children.name = this.getRouteName(item);
        children.path = childPath;
        children.component = MENU_COMPONENT_LAYOUT_LINK;
        children.meta = this.getRouteMeta(item);
        router.meta.hideChildInMenu = true;
        router.children = [children];
        router.name = item.menuId;
        router.path = menuPath;
        router.redirect = childPath;
        router.component = MENU_COMPONENT_LAYOUT_BASIC;
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
   * @param sysMenu 菜单信息
   * @return 路由名称
   */
  private getRouteName(sysMenu: SysMenu): string {
    const routerName = parseFirstUpper(sysMenu.path);
    // 路径链接
    if (validHttp(sysMenu.path)) {
      return `${routerName.substring(0, 5)}Link${sysMenu.menuId}`;
    }
    return routerName;
  }

  /**
   * 获取路由地址
   *
   * @param sysMenu 菜单信息
   * @return 路由地址
   */
  private getRouterPath(sysMenu: SysMenu): string {
    let routerPath = `${sysMenu.path}`;

    // 显式路径
    if (!routerPath || routerPath.startsWith('/')) {
      return routerPath;
    }

    // 路径链接 内部跳转
    if (validHttp(routerPath) && sysMenu.isFrame === STATUS_YES) {
      routerPath = routerPath.replace(/^http(s)?:\/\/+/, '');
      routerPath = Buffer.from(routerPath, 'utf8').toString('base64');
    }

    // 父菜单 内部跳转
    if (sysMenu.parentId === '0' && sysMenu.isFrame === STATUS_YES) {
      routerPath = `/${routerPath}`;
    }

    return routerPath;
  }

  /**
   * 获取组件信息
   *
   * @param sysMenu 菜单信息
   * @return 组件信息
   */
  private getComponent(sysMenu: SysMenu): string {
    // 内部跳转 路径链接
    if (sysMenu.isFrame === STATUS_YES && validHttp(sysMenu.path)) {
      return MENU_COMPONENT_LAYOUT_LINK;
    }

    // 非父菜单 目录类型
    if (sysMenu.parentId !== '0' && sysMenu.menuType === MENU_TYPE_DIR) {
      return MENU_COMPONENT_LAYOUT_BLANK;
    }

    // 组件路径 内部跳转 菜单类型
    if (
      sysMenu.component &&
      sysMenu.isFrame === STATUS_YES &&
      sysMenu.menuType === MENU_TYPE_MENU
    ) {
      // 父菜单套外层布局
      if (sysMenu.parentId === '0') {
        return MENU_COMPONENT_LAYOUT_BASIC;
      }
      return sysMenu.component;
    }

    return MENU_COMPONENT_LAYOUT_BASIC;
  }

  /**
   * 获取路由元信息
   *
   * @param sysMenu 菜单信息
   * @return 元信息
   */
  private getRouteMeta(sysMenu: SysMenu): RouterMateVo {
    const meta = new RouterMateVo();
    meta.icon = sysMenu.icon === '#' ? '' : sysMenu.icon;
    meta.title = sysMenu.menuName;
    meta.hideChildInMenu = false;
    meta.hideInMenu = sysMenu.visible === STATUS_NO;
    meta.cache = sysMenu.isCache === STATUS_YES;
    meta.target = '';

    // 路径链接 非内部跳转
    if (validHttp(sysMenu.path) && sysMenu.isFrame === STATUS_NO) {
      meta.target = '_blank';
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
