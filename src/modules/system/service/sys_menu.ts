import { Provide, Inject, Singleton } from '@midwayjs/core';

import {
  MENU_COMPONENT_LAYOUT_BASIC,
  MENU_COMPONENT_LAYOUT_BLANK,
  MENU_COMPONENT_LAYOUT_LINK,
  MENU_PATH_INLINE,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../framework/constants/menu';
import { replace, validHttp } from '../../../framework/utils/regular/regular';
import { ConvertToCamelCase } from '../../../framework/utils/parse/parse';
import { STATUS_NO, STATUS_YES } from '../../../framework/constants/common';
import { TreeSelect, sysMenuTreeSelect } from '../model/vo/tree_select';
import { Router, RouterMeta } from '../model/vo/router';
import { SysMenuRepository } from '../repository/sys_menu';
import { SysRoleMenuRepository } from '../repository/sys_role_menu';
import { SysRoleRepository } from '../repository/sys_role';
import { SysMenu } from '../model/sys_menu';

/**菜单 服务层处理 */
@Provide()
@Singleton()
export class SysMenuService {
  /**菜单服务 */
  @Inject()
  private sysMenuRepository: SysMenuRepository;

  /**角色与菜单关联服务 */
  @Inject()
  private sysRoleMenuRepository: SysRoleMenuRepository;

  /**角色服务 */
  @Inject()
  private sysRoleRepository: SysRoleRepository;

  /**
   * 查询数据
   * @param sysMenu 信息
   * @param userId 用户ID
   * @returns []
   */
  public async find(sysMenu: SysMenu, userId: number): Promise<SysMenu[]> {
    return await this.sysMenuRepository.select(sysMenu, userId);
  }

  /**
   * 根据ID查询信息
   * @param menuId ID
   * @returns 结果
   */
  public async findById(menuId: number): Promise<SysMenu> {
    if (menuId <= 0) {
      return new SysMenu();
    }
    const menus = await this.sysMenuRepository.selectByIds([menuId]);
    if (menus.length > 0) {
      return menus[0];
    }
    return new SysMenu();
  }

  /**
   * 新增信息
   * @param sysMenu 信息
   * @returns ID
   */
  public async insert(sysMenu: SysMenu): Promise<number> {
    return await this.sysMenuRepository.insert(sysMenu);
  }

  /**
   * 修改信息
   * @param sysMenu 信息
   * @returns 影响记录数
   */
  public async update(sysMenu: SysMenu): Promise<number> {
    return await this.sysMenuRepository.update(sysMenu);
  }

  /**
   * 删除信息
   * @param menuId ID
   * @returns 影响记录数
   */
  public async deleteById(menuId: number): Promise<number> {
    await this.sysRoleMenuRepository.deleteByMenuIds([menuId]); // 删除角色与部门关联
    return await this.sysMenuRepository.deleteById(menuId);
  }

  /**
   * 菜单下同状态存在子节点数量
   * @param menuId 菜单ID
   * @param status 状态
   * @returns 数量
   */
  public async existChildrenByMenuIdAndStatus(
    menuId: number,
    status: string
  ): Promise<number> {
    return await this.sysMenuRepository.existChildrenByMenuIdAndStatus(
      menuId,
      status
    );
  }

  /**
   * 菜单分配给的角色数量
   * @param menuId 菜单ID
   * @returns 数量
   */
  public async existRoleByMenuId(menuId: number): Promise<number> {
    return await this.sysRoleMenuRepository.existRoleByMenuId(menuId);
  }

  /**
   * 检查同级下菜单名称是否唯一
   * @param parentId 父级部门ID
   * @param menuName 菜单名称
   * @param menuId 菜单ID
   * @returns 结果
   */
  public async checkUniqueParentIdByMenuName(
    parentId: number,
    menuName: string,
    menuId: number
  ): Promise<boolean> {
    const sysMenu = new SysMenu();
    sysMenu.menuName = menuName;
    sysMenu.parentId = parentId;
    const uniqueId = await this.sysMenuRepository.checkUnique(sysMenu);
    if (uniqueId === menuId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 检查同级下路由地址是否唯一（针对目录和菜单）
   * @param parentId 父级部门ID
   * @param menuPath 菜单路径
   * @param menuId 菜单ID
   * @returns 结果
   */
  public async checkUniqueParentIdByMenuPath(
    parentId: number,
    menuPath: string,
    menuId: number
  ): Promise<boolean> {
    const sysMenu = new SysMenu();
    sysMenu.menuPath = menuPath;
    sysMenu.parentId = parentId;
    const uniqueId = await this.sysMenuRepository.checkUnique(sysMenu);
    if (uniqueId === menuId) {
      return true;
    }
    return uniqueId === 0;
  }

  /**
   * 根据用户ID查询权限标识
   * @param userId 用户ID
   * @returns 数量
   */
  public async findPermsByUserId(userId: number): Promise<string[]> {
    return await this.sysMenuRepository.selectPermsByUserId(userId);
  }

  /**
   * 根据角色ID查询菜单树信息
   * @param roleId 角色ID
   * @returns 菜单ID数组
   */
  public async findByRoleId(roleId: number): Promise<number[]> {
    const roles = await this.sysRoleRepository.selectByIds([roleId]);
    if (roles.length > 0) {
      const role = roles[0];
      if (role.roleId === roleId) {
        return await this.sysMenuRepository.selectByRoleId(
          role.roleId,
          role.menuCheckStrictly === '1'
        );
      }
    }
    return [];
  }

  /**
   * 根据用户ID查询菜单树状嵌套
   * @param userId 用户ID
   * @returns 结果
   */
  public async buildTreeMenusByUserId(userId: number): Promise<SysMenu[]> {
    const arr = await this.sysMenuRepository.selectTreeByUserId(userId);
    return this.parseDataToTree(arr);
  }

  /**
   * 根据用户ID查询菜单树状结构
   * @param sysMenu 信息
   * @param userId 用户ID
   * @returns 结果
   */
  public async buildTreeSelectByUserId(
    sysMenu: SysMenu,
    userId: number
  ): Promise<TreeSelect[]> {
    const arr = await this.sysMenuRepository.select(sysMenu, userId);
    const treeArr = await this.parseDataToTree(arr);
    const tree: TreeSelect[] = [];
    for (const item of treeArr) {
      tree.push(sysMenuTreeSelect(item));
    }
    return tree;
  }

  /**
   * 将数据解析为树结构，构建前端所需要下拉树结构
   * @param arr 菜单对象数组
   * @returns 数组
   */
  private async parseDataToTree(arr: SysMenu[]): Promise<SysMenu[]> {
    // 节点分组
    const map: Map<number, SysMenu[]> = new Map();
    // 节点id
    const treeIds: number[] = [];
    // 树节点
    const tree: SysMenu[] = [];

    for (const item of arr) {
      const parentId = item.parentId;
      // 分组
      const mapItem = map.get(parentId) ?? [];
      mapItem.push(item);
      map.set(parentId, mapItem);
      // 记录节点id
      treeIds.push(item.menuId);
    }

    for (const [key, value] of map) {
      // 选择不是节点id的作为树节点
      if (!treeIds.includes(key)) {
        tree.push(...value);
      }
    }

    for (const iterator of tree) {
      componet(iterator);
    }

    /**闭包递归函数 */
    function componet(iterator: SysMenu) {
      const id = iterator.menuId;
      const item = map.get(id);
      if (item) {
        iterator.children = item;
      }
      if (iterator.children) {
        for (const v of iterator.children) {
          componet(v);
        }
      }
    }
    return tree;
  }

  /**
   * 构建前端路由所需要的菜单
   * @param sysMenus 菜单数组
   * @param prefix 前缀字符
   * @returns
   */
  public async buildRouteMenus(
    sysMenus: SysMenu[],
    prefix = ''
  ): Promise<Router[]> {
    const routers: Router[] = [];
    for (const item of sysMenus) {
      const router = new Router();
      router.name = this.getRouteName(item);
      router.path = this.getRouterPath(item);
      router.component = this.getComponent(item);
      router.meta = this.getRouteMeta(item);
      router.children = [];
      router.redirect = '';

      // 子项菜单 目录类型 非路径链接
      const cMenus = item.children;
      if (
        Array.isArray(cMenus) &&
        cMenus.length > 0 &&
        item.menuType === MENU_TYPE_DIR &&
        !validHttp(item.menuPath)
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
        item.parentId === 0 &&
        item.frameFlag === STATUS_YES &&
        item.menuType === MENU_TYPE_MENU
      ) {
        // 父菜单 内部跳转 菜单类型
        const menuPath = '/' + item.menuId;
        const childPath = menuPath + this.getRouterPath(item);
        const children = new Router();
        children.name = this.getRouteName(item);
        children.path = childPath;
        children.component = item.component;
        children.meta = this.getRouteMeta(item);
        router.meta.hideChildInMenu = true;
        router.children = [children];
        router.name = `${item.menuId}`;
        router.path = menuPath;
        router.redirect = childPath;
        router.component = MENU_COMPONENT_LAYOUT_BASIC;
      } else if (
        item.parentId === 0 &&
        item.frameFlag === STATUS_YES &&
        validHttp(item.menuPath)
      ) {
        // 父菜单 内部跳转 路径链接
        const menuPath = '/' + item.menuId;
        const childPath = menuPath + this.getRouterPath(item);
        const children = new Router();
        children.name = this.getRouteName(item);
        children.path = childPath;
        children.component = MENU_COMPONENT_LAYOUT_LINK;
        children.meta = this.getRouteMeta(item);
        router.meta.hideChildInMenu = true;
        router.children = [children];
        router.name = `${item.menuId}`;
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
    const routerName = ConvertToCamelCase(sysMenu.menuPath);
    // 路径链接
    if (validHttp(sysMenu.menuPath)) {
      return `${routerName.substring(0, 5)}Link${sysMenu.menuId}`;
    }
    // 拼上菜单ID防止name重名
    return routerName + '_' + sysMenu.menuId;
  }

  /**
   * 获取路由地址
   *
   * @param sysMenu 菜单信息
   * @return 路由地址
   */
  private getRouterPath(sysMenu: SysMenu): string {
    let routerPath = `${sysMenu.menuPath}`;

    // 显式路径
    if (!routerPath || routerPath.startsWith('/')) {
      return routerPath;
    }

    // 路径链接 内部跳转
    if (validHttp(routerPath) && sysMenu.frameFlag === STATUS_YES) {
      routerPath = replace('/^http(s)?://+/', routerPath, '');
      routerPath = Buffer.from(routerPath, 'utf8').toString('base64');
    }

    // 父菜单 内部跳转
    if (sysMenu.parentId === 0 && sysMenu.frameFlag === STATUS_YES) {
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
    if (sysMenu.frameFlag === STATUS_YES && validHttp(sysMenu.menuPath)) {
      return MENU_COMPONENT_LAYOUT_LINK;
    }

    // 非父菜单 目录类型
    if (sysMenu.parentId > 0 && sysMenu.menuType === MENU_TYPE_DIR) {
      return MENU_COMPONENT_LAYOUT_BLANK;
    }

    // 组件路径 内部跳转 菜单类型
    if (
      sysMenu.component &&
      sysMenu.frameFlag === STATUS_YES &&
      sysMenu.menuType === MENU_TYPE_MENU
    ) {
      // 父菜单套外层布局
      if (sysMenu.parentId === 0) {
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
  private getRouteMeta(sysMenu: SysMenu): RouterMeta {
    const meta = new RouterMeta();
    meta.icon = sysMenu.icon === '#' ? '' : sysMenu.icon;
    meta.title = sysMenu.menuName;
    meta.hideChildInMenu = false;
    meta.hideInMenu = sysMenu.visibleFlag === STATUS_NO;
    meta.cache = sysMenu.cacheFlag === STATUS_YES;
    meta.target = '';

    // 路径链接 非内部跳转
    if (validHttp(sysMenu.menuPath) && sysMenu.frameFlag === STATUS_NO) {
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
      item => item.frameFlag === STATUS_YES && item.visibleFlag === STATUS_YES
    );
    // 检查内嵌隐藏菜单是否可做重定向
    if (!firstChild) {
      firstChild = cMenus.find(
        item =>
          item.frameFlag === STATUS_YES &&
          item.visibleFlag === STATUS_NO &&
          item.menuPath.includes(MENU_PATH_INLINE)
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
