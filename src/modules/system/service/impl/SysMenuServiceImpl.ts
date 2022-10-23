import { Provide, Inject } from '@midwayjs/decorator';
import { HTTP, HTTPS, WWW } from '../../../../common/constants/CommonConstants';
import {
  INNER_LINK,
  LAYOUT,
  NO_FRAME,
  PARENT_VIEW,
  TYPE_DIR,
  TYPE_MENU,
} from '../../../../common/constants/UserConstants';
import { parsefirstUpper } from '../../../../common/utils/ParseUtils';
import { validHttp } from '../../../../common/utils/RegularUtils';
import { SysMenu } from '../../../../framework/core/model/SysMenu';
import { TreeSelect } from '../../../../framework/core/TreeSelect';
import { ContextService } from '../../../../framework/service/ContextService';
import { MetaVo } from '../../model/vo/MetaVo';
import { RouterVo } from '../../model/vo/RouterVo';
import { SysMenuRepositoryImpl } from '../../repository/impl/SysMenuRepositoryImpl';
import { ISysMenuService } from '../ISysMenuService';

/**
 * 菜单 服务层实现
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
export class SysMenuServiceImpl implements ISysMenuService {
  @Inject()
  private sysMenuRepository: SysMenuRepositoryImpl;

  @Inject()
  private contextService: ContextService;

  selectMenuList(sysMenu: SysMenu, userId: string): Promise<SysMenu[]> {
    throw new Error('Method not implemented.');
  }
  async selectMenuPermsByUserId(userId: string): Promise<string[]> {
    const perms = await this.sysMenuRepository.selectMenuPermsByUserId(userId);
    const perms_arr: string[] = [];
    for (const perm of perms) {
      if (perm) {
        perms_arr.push(...perm.trim().split(','));
      }
    }
    return [...new Set(perms_arr)];
  }
  async selectMenuPermsByRoleId(roleId: string): Promise<string[]> {
    const perms = await this.sysMenuRepository.selectMenuPermsByRoleId(roleId);
    const perms_arr: string[] = [];
    for (const perm of perms) {
      if (perm) {
        perms_arr.push(...perm.trim().split(','));
      }
    }
    return [...new Set(perms_arr)];
  }
  async selectMenuTreeByUserId(userId: string): Promise<SysMenu[]> {
    let menus: SysMenu[] = [];
    if (this.contextService.isSuperAdmin(userId)) {
      menus = await this.sysMenuRepository.selectMenuTreeAll();
    } else {
      menus = await this.sysMenuRepository.selectMenuTreeByUserId(userId);
    }
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
    let returnList = [];
    for (const sysMenu of sysMenuList) {
      // 一、根据传入的某个父节点ID,遍历该父节点的所有子节点
      if (sysMenu.parentId == parentId) {
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
    childList.forEach(v => {
      if (this.hasChild(sysMenuList, v)) {
        v = this.recursionFn(sysMenuList, v);
      }
    });
    return sysMenu;
  }

  /**
   * 得到子节点列表
   */
  private getChildList(sysMenuList: SysMenu[], sysMenu: SysMenu): SysMenu[] {
    let sysMenus: SysMenu[] = [];
    for (const child of sysMenuList) {
      if (child.parentId == sysMenu.menuId) {
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

  selectMenuListByRoleId(roleId: string): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async buildMenus(sysMenus: SysMenu[]): Promise<RouterVo[]> {
    const routers: RouterVo[] = [];
    for (const menu of sysMenus) {
      const router = new RouterVo();
      router.hidden = menu.visible === '1';
      router.name = this.getRouteName(menu);
      router.path = this.getRouterPath(menu);
      router.component = this.getComponent(menu);
      router.query = menu.query;
      const metaVo = new MetaVo();
      metaVo.newTitleIconCacheLike(
        menu.menuName,
        menu.icon,
        menu.isCache === 1,
        menu.path
      );
      router.meta = metaVo;
      // 子项菜单目录
      const cMenus = menu.children;
      if (cMenus && cMenus.length > 0 && TYPE_DIR === menu.menuType) {
        router.alwaysShow = true;
        router.redirect = 'noRedirect';
        router.children = await this.buildMenus(cMenus);
      }
      // 为菜单内部跳转
      const isMenuFrame = this.isMenuFrame(menu);
      if (isMenuFrame) {
        router.meta = null;
        const childrenList: RouterVo[] = [];
        const children = new RouterVo();
        children.path = menu.path;
        children.component = menu.component;
        children.name = parsefirstUpper(menu.path);
        const mateVoChildren = new MetaVo();
        mateVoChildren.newTitleIconCacheLike(
          menu.menuName,
          menu.icon,
          menu.isCache === 1,
          menu.path
        );
        children.meta = mateVoChildren;
        children.query = menu.query;
        childrenList.push(children);
        router.children = childrenList;
      }
      // 父id且为内链组件
      const isInnerLink = this.isInnerLink(menu);
      if (menu.parentId === '0' && isInnerLink) {
        const mateVo = new MetaVo();
        mateVo.newTitleIcon(menu.menuName, menu.icon);
        router.meta = mateVo;
        router.path = '/';
        const childrenList: RouterVo[] = [];
        const children = new RouterVo();
        const routerPath = this.innerLinkReplaceEach(menu.path);
        children.path = routerPath;
        children.component = INNER_LINK;
        children.name = parsefirstUpper(routerPath);
        const mateVoChildren = new MetaVo();
        mateVoChildren.newTitleIconLink(menu.menuName, menu.icon, menu.path);
        children.meta = mateVoChildren;
        childrenList.push(children);
        router.children = childrenList;
      }
      routers.push(router);
    }
    return routers;
  }

  buildMenuTree(sysMenus: SysMenu[]): Promise<SysMenu[]> {
    throw new Error('Method not implemented.');
  }
  buildMenuTreeSelect(sysMenus: SysMenu[]): Promise<TreeSelect[]> {
    throw new Error('Method not implemented.');
  }
  selectMenuById(menuId: string): Promise<SysMenu> {
    throw new Error('Method not implemented.');
  }
  hasChildByMenuId(menuId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  checkMenuExistRole(menuId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  insertMenu(sysMenu: SysMenu): Promise<number> {
    throw new Error('Method not implemented.');
  }
  updateMenu(sysMenu: SysMenu): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteMenuById(menuId: string): Promise<number> {
    throw new Error('Method not implemented.');
  }
  checkUniqueNenuName(menuName: string): Promise<SysMenu> {
    throw new Error('Method not implemented.');
  }

  /**
   * 获取路由名称
   *
   * @param menu 菜单信息
   * @return 路由名称
   */
  private getRouteName(menu: SysMenu): string {
    let routerName = parsefirstUpper(menu.path);
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
      TYPE_DIR === menu.menuType &&
      Number(NO_FRAME) === menu.isFrame
    ) {
      routerPath = '/' + menu.path;
    }
    // 非外链并且是一级目录（类型为菜单）
    else if (this.isMenuFrame(menu)) {
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
    let component = LAYOUT;
    if (menu.component && !this.isMenuFrame(menu)) {
      component = menu.component;
    } else if (
      menu.component &&
      menu.parentId !== '0' &&
      this.isInnerLink(menu)
    ) {
      component = INNER_LINK;
    } else if (menu.component && this.isParentView(menu)) {
      component = PARENT_VIEW;
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
    return menu.isFrame === Number(NO_FRAME) && validHttp(menu.path);
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
      TYPE_MENU === menu.menuType &&
      menu.isFrame === Number(NO_FRAME)
    );
  }

  /**
   * 是否为parent_view组件
   *
   * @param menu 菜单信息
   * @return 结果
   */
  private isParentView(menu: SysMenu): boolean {
    return menu.parentId !== '0' && TYPE_DIR === menu.menuType;
  }

  /**
   * 内链域名特殊字符替换
   *
   * @return
   */
  private innerLinkReplaceEach(path: string): string {
    path.replace(HTTP, '');
    path.replace(HTTPS, '');
    path.replace(WWW, '');
    path.replace('.', '/');
    return path;
  }
}
