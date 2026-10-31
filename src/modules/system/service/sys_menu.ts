import { Inject, Provide, Singleton } from '@midwayjs/core';

import {
  MENU_TYPE_AUTH,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../internal/shared/constants/menu';
import { validHttp } from '../../../internal/shared/regular/regular';
import { STATUS_NO, STATUS_YES } from '../../../internal/shared/constants/common';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { TreeSelect, sysMenuTreeSelect } from '../model/vo/tree_select';
import { AuthMenu } from '../model/vo/auth_menu';
import { SysMenuRepository } from '../repository/sys_menu';
import { SysRoleMenuRepository } from '../repository/sys_role_menu';
import { SysRoleRepository } from '../repository/sys_role';
import { SysMenu } from '../model/sys_menu';

/** Menu service. */
@Provide()
@Singleton()
export class SysMenuService {
  @Inject()
  private db: DynamicDataSource;

  @Inject()
  private sysMenuRepository: SysMenuRepository;

  @Inject()
  private sysRoleMenuRepository: SysRoleMenuRepository;

  @Inject()
  private sysRoleRepository: SysRoleRepository;

  public async find(sysMenu: SysMenu, userId: number): Promise<SysMenu[]> {
    return await this.sysMenuRepository.select(sysMenu, userId);
  }

  public async findById(menuId: number): Promise<SysMenu> {
    if (menuId <= 0) {
      return new SysMenu();
    }
    const menus = await this.sysMenuRepository.selectByIds([menuId]);
    return menus[0] ?? new SysMenu();
  }

  public async insert(sysMenu: SysMenu): Promise<number> {
    if (sysMenu.createBy) {
      const ms = Date.now();
      sysMenu.updateBy = sysMenu.createBy;
      sysMenu.updateTime = ms;
      sysMenu.createTime = ms;
    }
    this.normalizeMenuFields(sysMenu);
    return await this.sysMenuRepository.insert(sysMenu);
  }

  public async update(sysMenu: SysMenu): Promise<number> {
    if (sysMenu.updateBy) {
      sysMenu.updateTime = Date.now();
    }
    this.normalizeMenuFields(sysMenu);
    return await this.sysMenuRepository.update(sysMenu);
  }

  public async deleteById(menuId: number): Promise<number> {
    return await this.db.transaction('', async manager => {
      await this.sysRoleMenuRepository.deleteByMenuIds([menuId], manager);
      return await this.sysMenuRepository.deleteById(menuId, manager);
    });
  }

  public async existChildrenByMenuIdAndStatus(
    menuId: number,
    status: string
  ): Promise<number> {
    return await this.sysMenuRepository.existChildrenByMenuIdAndStatus(
      menuId,
      status
    );
  }

  public async existRoleByMenuId(menuId: number): Promise<number> {
    return await this.sysRoleMenuRepository.existRoleByMenuId(menuId);
  }

  public async checkUniqueParentIdByMenuName(
    parentId: number,
    menuName: string,
    menuId: number
  ): Promise<boolean> {
    const sysMenu = new SysMenu();
    sysMenu.menuName = menuName;
    sysMenu.parentId = parentId;
    const uniqueId = await this.sysMenuRepository.checkUnique(sysMenu);
    return uniqueId === menuId || uniqueId === 0;
  }

  public async checkUniqueMenuPath(
    menuPath: string,
    menuId: number
  ): Promise<boolean> {
    const uniqueId = await this.sysMenuRepository.checkUniqueMenuPath(
      menuPath,
      menuId
    );
    return uniqueId === 0;
  }

  public async findPermsByUserId(userId: number): Promise<string[]> {
    return await this.sysMenuRepository.selectPermsByUserId(userId);
  }

  public async findByRoleId(roleId: number): Promise<number[]> {
    const roles = await this.sysRoleRepository.selectByIds([roleId]);
    const role = roles[0];
    if (role?.id !== roleId) {
      return [];
    }
    return await this.sysMenuRepository.selectByRoleId(
      role.id,
      role.roleMenuCheckStrictly === '1'
    );
  }

  public async buildTreeMenusByUserId(userId: number): Promise<SysMenu[]> {
    const rows = await this.sysMenuRepository.selectTreeByUserId(userId);
    return this.parseDataToTree(rows);
  }

  public async buildTreeSelectByUserId(
    sysMenu: SysMenu,
    userId: number
  ): Promise<TreeSelect[]> {
    const rows = await this.sysMenuRepository.select(sysMenu, userId);
    return this.parseDataToTree(rows).map(sysMenuTreeSelect);
  }

  private parseDataToTree(rows: SysMenu[]): SysMenu[] {
    const nodesMap = new Map<number, SysMenu[]>();
    const treeIds = new Set<number>();
    for (const item of rows) {
      const children = nodesMap.get(item.parentId) ?? [];
      children.push(item);
      nodesMap.set(item.parentId, children);
      treeIds.add(item.id);
    }

    const tree: SysMenu[] = [];
    for (const [parentId, children] of nodesMap) {
      if (!treeIds.has(parentId)) {
        tree.push(...children);
      }
    }
    return tree.map(node => this.attachChildren(node, nodesMap));
  }

  private attachChildren(
    node: SysMenu,
    nodesMap: Map<number, SysMenu[]>
  ): SysMenu {
    const children = nodesMap.get(node.id);
    if (children) {
      node.children = children.map(child =>
        this.attachChildren(child, nodesMap)
      );
    }
    return node;
  }

  public buildAuthMenus(sysMenus: SysMenu[]): AuthMenu[] {
    return sysMenus.map(item => {
      const menu = new AuthMenu();
      menu.id = item.id;
      menu.kind = this.getAuthMenuKind(item);
      menu.title = item.menuName;
      menu.path = item.menuPath;
      menu.icon = item.menuIcon === '#' ? '' : item.menuIcon;
      menu.hidden = item.menuVisible === STATUS_NO;
      menu.cache = item.menuCache === STATUS_YES;
      menu.children = [];
      if (menu.kind === 'external') {
        menu.target = '_blank';
      }
      if (menu.kind === 'page') {
        menu.component = item.menuComponent;
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        menu.children = this.buildAuthMenus(item.children);
      }
      return menu;
    });
  }

  private getAuthMenuKind(sysMenu: SysMenu): AuthMenu['kind'] {
    if (validHttp(sysMenu.menuPath)) {
      return sysMenu.menuExternal === STATUS_YES ? 'external' : 'iframe';
    }
    if (sysMenu.menuType === MENU_TYPE_DIR) {
      return 'directory';
    }
    return 'page';
  }

  private normalizeMenuFields(sysMenu: SysMenu): void {
    if (!sysMenu.menuIcon) {
      sysMenu.menuIcon = '#';
    }
    if (sysMenu.menuType === MENU_TYPE_AUTH) {
      sysMenu.menuComponent = '';
      sysMenu.menuExternal = '0';
      sysMenu.menuCache = '1';
      sysMenu.menuVisible = '1';
      sysMenu.menuPath = '';
      sysMenu.menuIcon = '#';
    } else if (sysMenu.menuType === MENU_TYPE_DIR) {
      sysMenu.menuComponent = '';
      sysMenu.menuCache = '1';
      sysMenu.menuPerms = '';
    }
    if (sysMenu.menuType === MENU_TYPE_MENU && validHttp(sysMenu.menuPath)) {
      sysMenu.menuComponent = '';
      sysMenu.menuPerms = '';
    }
  }
}
