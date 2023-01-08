import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import {
  HTTP,
  HTTPS,
  WWW,
} from '../../../../framework/constants/CommonConstants';
import { parseFirstUpper } from '../../../../framework/utils/ValueParseUtils';
import { validHttp } from '../../../../framework/utils/RegularUtils';
import { TreeSelect } from '../../../../framework/model/TreeSelect';
import { MetaVo } from '../../model/vo/MetaVo';
import { RouterVo } from '../../model/vo/RouterVo';
import { SysMenuRepositoryImpl } from '../../repository/impl/SysMenuRepositoryImpl';
import { ISysMenuService } from '../ISysMenuService';
import { SysRoleRepositoryImpl } from '../../repository/impl/SysRoleRepositoryImpl';
import { SysRoleMenuRepositoryImpl } from '../../repository/impl/SysRoleMenuRepositoryImpl';
import { STATUS_NO } from '../../../../framework/constants/CommonConstants';
import { SysMenu } from '../../model/SysMenu';
import {
  MENU_COMPONENT_INNER_LINK,
  MENU_COMPONENT_LAYOUT,
  MENU_COMPONENT_PARENT_VIEW,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../../framework/constants/MenuConstants';

/**
 * 菜单 服务层实现
 *
 * @author TsMask <340112800@qq.com>
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
        permsArr.push(...perm.trim().split(','));
      }
    }
    return [...new Set(permsArr)];
  }

  async selectMenuPermsByRoleId(roleId: string): Promise<string[]> {
    const perms = await this.sysMenuRepository.selectMenuPermsByRoleId(roleId);
    const permsArr: string[] = [];
    for (const perm of perms) {
      if (perm) {
        permsArr.push(...perm.trim().split(','));
      }
    }
    return [...new Set(permsArr)];
  }

  async selectMenuTreeByUserId(userId: string): Promise<SysMenu[]> {
    const menus = await this.sysMenuRepository.selectMenuTreeByUserId(userId);
    return this.getChildPerms(menus, '0');
  }

  /**
   * 根据父节点的ID获取所有子节点
   *
   * @param sysMenuList 分类表
   * @param parentId 传入的父节点ID
   * @return 菜单标识字符串数组
   */
  private getChildPerms(sysMenuList: SysMenu[], parentId: string): SysMenu[] {
    const returnList = [];
    for (const sysMenu of sysMenuList) {
      // 根据传入的某个父节点ID,遍历该父节点的所有子节点
      if (sysMenu.parentId === parentId) {
        const menu = this.recursionFn(sysMenuList, sysMenu);
        returnList.push(menu);
      }
    }
    return returnList;
  }
  /**
   * 递归列表
   *
   * @param sysMenuList 菜单列表
   * @param sysMenu 当前菜单
   */
  private recursionFn(sysMenuList: SysMenu[], sysMenu: SysMenu) {
    // 得到子节点列表
    const childList = this.getChildList(sysMenuList, sysMenu);
    sysMenu.children = childList;
    childList.forEach(child => {
      if (this.hasChild(sysMenuList, child)) {
        child = this.recursionFn(sysMenuList, child);
      }
    });
    return sysMenu;
  }

  /**
   * 得到子节点列表
   */
  private getChildList(sysMenuList: SysMenu[], sysMenu: SysMenu): SysMenu[] {
    const sysMenus: SysMenu[] = [];
    for (const child of sysMenuList) {
      if (child.parentId === sysMenu.menuId) {
        sysMenus.push(child);
      }
    }
    return sysMenus;
  }

  /**
   * 判断是否有子节点
   */
  private hasChild(sysMenuList: SysMenu[], sysMenu: SysMenu): boolean {
    return this.getChildList(sysMenuList, sysMenu).length > 0;
  }

  async selectMenuTreeSelectByUserId(
    sysMenu: SysMenu,
    userId: string
  ): Promise<TreeSelect[]> {
    const menus = await this.sysMenuRepository.selectMenuList(sysMenu, userId);
    return this.buildMenuTreeSelect(menus);
  }

  /**
   * 构建前端所需要下拉树结构
   *
   * @param sysMenus 菜单列表
   * @return 下拉树结构列表
   */
  private buildMenuTreeSelect(sysMenus: SysMenu[]): TreeSelect[] {
    const menuTrees: SysMenu[] = this.buildMenuTree(sysMenus);
    return menuTrees.map(menu => new TreeSelect().parseSysMenu(menu));
  }

  /**
   * 构建前端所需要树结构
   *
   * @param sysMenus 菜单列表
   * @return 树结构列表
   */
  private buildMenuTree(sysMenus: SysMenu[]): SysMenu[] {
    let resultArr: SysMenu[] = [];
    const menuIds: string[] = sysMenus.map(menu => menu.menuId);
    for (const menu of sysMenus) {
      // 如果是顶级节点, 遍历该父节点的所有子节点
      if (!menuIds.includes(menu.parentId)) {
        menu.children = this.fnChildren(sysMenus, menu.menuId);
        resultArr.push(menu);
      }
    }
    if (resultArr.length === 0) {
      resultArr = sysMenus;
    }
    return resultArr;
  }

  /**
   * 递归得到菜单列表
   * @param sysMenus 菜单列表
   * @param menuId 当前菜单ID
   * @return 递归得到菜单列表
   */
  private fnChildren(sysMenus: SysMenu[], menuId: string): SysMenu[] {
    // 得到子节点列表
    const childrens: SysMenu[] = this.getChildrens(sysMenus, menuId);
    for (const child of childrens) {
      // 判断是否有子节点
      const hasChildren = this.getChildrens(sysMenus, child.menuId);
      if (hasChildren.length > 0) {
        child.children = this.fnChildren(sysMenus, child.menuId);
      }
    }
    return childrens;
  }

  /**
   * 得到菜单子节点列表
   * @param sysMenus 菜单列表
   * @param menuId 当前菜单ID
   * @return 递归得到菜单子节点列表
   */
  private getChildrens(sysMenus: SysMenu[], menuId: string): SysMenu[] {
    const childrens: SysMenu[] = [];
    for (const dept of sysMenus) {
      if (dept.parentId && dept.parentId === menuId) {
        childrens.push(dept);
      }
    }
    return childrens;
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

  async buildRouteMenus(sysMenus: SysMenu[]): Promise<RouterVo[]> {
    const routers: RouterVo[] = [];
    for (const menu of sysMenus) {
      const router = new RouterVo();
      router.query = menu.query;
      router.hidden = menu.visible === STATUS_NO;
      router.name = this.getRouteName(menu);
      router.path = this.getRouterPath(menu);
      router.component = this.getComponent(menu);
      router.meta = new MetaVo().newTitleIconCacheLike(
        menu.menuName,
        menu.icon,
        menu.isCache === STATUS_NO,
        menu.path
      );

      // 子项菜单目录
      const cMenus = menu.children;
      if (
        Array.isArray(cMenus) &&
        cMenus.length > 0 &&
        menu.menuType === MENU_TYPE_DIR
      ) {
        router.alwaysShow = true;
        router.redirect = 'noRedirect';
        router.children = await this.buildRouteMenus(cMenus);
      }

      // 为菜单内部跳转
      if (this.isMenuFrame(menu)) {
        router.meta = null;
        const childrenList: RouterVo[] = [];
        const children = new RouterVo();
        children.query = menu.query;
        children.path = menu.path;
        children.component = menu.component;
        children.name = parseFirstUpper(menu.path);
        children.meta = new MetaVo().newTitleIconCacheLike(
          menu.menuName,
          menu.icon,
          menu.isCache === STATUS_NO,
          menu.path
        );
        childrenList.push(children);
        router.children = childrenList;
      }

      // 父id且为内链组件
      if (menu.parentId === '0' && this.isInnerLink(menu)) {
        router.path = '/';
        router.meta = new MetaVo().newTitleIcon(menu.menuName, menu.icon);
        const childrenList: RouterVo[] = [];
        const children = new RouterVo();
        const routerPath = this.innerLinkReplaceEach(menu.path);
        children.path = routerPath;
        children.name = parseFirstUpper(routerPath);
        children.component = MENU_COMPONENT_INNER_LINK;
        children.meta = new MetaVo().newTitleIconLink(
          menu.menuName,
          menu.icon,
          menu.path
        );
        childrenList.push(children);
        router.children = childrenList;
      }

      routers.push(router);
    }
    return routers;
  }

  /**
   * 获取路由名称
   *
   * @param menu 菜单信息
   * @return 路由名称
   */
  private getRouteName(menu: SysMenu): string {
    let routerName = parseFirstUpper(menu.path);
    // 非外链并且是一级目录（类型为目录）
    if (this.isMenuFrame(menu)) {
      routerName = '';
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
    let routerPath = menu.path;
    // 内链打开外网方式
    if (menu.parentId !== '0' && this.isInnerLink(menu)) {
      routerPath = this.innerLinkReplaceEach(routerPath);
    }
    // 非外链并且是一级目录（类型为目录）
    if (
      menu.parentId === '0' &&
      menu.isFrame === STATUS_NO &&
      menu.menuType === MENU_TYPE_DIR
    ) {
      routerPath = `/${menu.path}`;
    }
    // 非外链并且是一级目录（类型为菜单）
    if (this.isMenuFrame(menu)) {
      routerPath = '/';
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
    let component: string = MENU_COMPONENT_LAYOUT;
    if (menu.component && !this.isMenuFrame(menu)) {
      component = menu.component;
    } else if (
      !menu.component &&
      menu.parentId !== '0' &&
      this.isInnerLink(menu)
    ) {
      component = MENU_COMPONENT_INNER_LINK;
    } else if (!menu.component && this.isParentView(menu)) {
      component = MENU_COMPONENT_PARENT_VIEW;
    }
    return component;
  }

  /**
   * 是否为内链组件
   *
   * @param menu 菜单信息
   * @return 结果
   */
  private isInnerLink(menu: SysMenu): boolean {
    return menu.isFrame === STATUS_NO && validHttp(menu.path);
  }

  /**
   * 是否为菜单内部跳转
   *
   * @param menu 菜单信息
   * @return 结果
   */
  private isMenuFrame(menu: SysMenu): boolean {
    return (
      menu.parentId === '0' &&
      menu.isFrame === STATUS_NO &&
      menu.menuType === MENU_TYPE_MENU
    );
  }

  /**
   * 是否为ParentView组件
   *
   * @param menu 菜单信息
   * @return 结果
   */
  private isParentView(menu: SysMenu): boolean {
    return menu.parentId !== '0' && menu.menuType === MENU_TYPE_DIR;
  }

  /**
   * 内链域名特殊字符替换
   *
   * @return
   */
  private innerLinkReplaceEach(path: string): string {
    path = path.replace(HTTP, '');
    path = path.replace(HTTPS, '');
    path = path.replace(WWW, '');
    path = path.replace('.', '/');
    return path;
  }
}
