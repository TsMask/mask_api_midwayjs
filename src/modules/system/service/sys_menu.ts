import { Inject, Provide, Singleton } from '@midwayjs/core';

import {
  MENU_TYPE_AUTH,
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../internal/shared/constants/menu';
import { validHttp } from '../../../internal/shared/regular/regular';
import {
  STATUS_NO,
  STATUS_YES,
} from '../../../internal/shared/constants/common';
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

  public async find(sysMenu: SysMenu, user_id: number): Promise<SysMenu[]> {
    return await this.sysMenuRepository.select(sysMenu, user_id);
  }

  public async findById(menu_id: number): Promise<SysMenu> {
    if (menu_id <= 0) {
      return new SysMenu();
    }
    const menus = await this.sysMenuRepository.selectByIds([menu_id]);
    return menus[0] ?? new SysMenu();
  }

  public async insert(sysMenu: SysMenu): Promise<number> {
    if (sysMenu.create_by) {
      const ms = Date.now();
      sysMenu.update_by = sysMenu.create_by;
      sysMenu.update_time = ms;
      sysMenu.create_time = ms;
    }
    this.normalizeMenuFields(sysMenu);
    return await this.sysMenuRepository.insert(sysMenu);
  }

  public async update(sysMenu: SysMenu): Promise<number> {
    if (sysMenu.update_by) {
      sysMenu.update_time = Date.now();
    }
    this.normalizeMenuFields(sysMenu);
    return await this.sysMenuRepository.update(sysMenu);
  }

  public async deleteById(menu_id: number): Promise<number> {
    return await this.db.transaction('', async manager => {
      await this.sysRoleMenuRepository.deleteByMenuIds([menu_id], manager);
      return await this.sysMenuRepository.deleteById(menu_id, manager);
    });
  }

  public async existChildrenByMenuIdAndStatus(
    menu_id: number,
    status: string
  ): Promise<number> {
    return await this.sysMenuRepository.existChildrenByMenuIdAndStatus(
      menu_id,
      status
    );
  }

  public async existRoleByMenuId(menu_id: number): Promise<number> {
    return await this.sysRoleMenuRepository.existRoleByMenuId(menu_id);
  }

  public async checkUniqueParentIdByMenuName(
    parent_id: number,
    menu_name: string,
    menu_id: number
  ): Promise<boolean> {
    const sysMenu = new SysMenu();
    sysMenu.menu_name = menu_name;
    sysMenu.parent_id = parent_id;
    const uniqueId = await this.sysMenuRepository.checkUnique(sysMenu);
    return uniqueId === menu_id || uniqueId === 0;
  }

  public async checkUniqueMenuPath(
    menu_path: string,
    menu_id: number
  ): Promise<boolean> {
    const uniqueId = await this.sysMenuRepository.checkUniqueMenuPath(
      menu_path,
      menu_id
    );
    return uniqueId === 0;
  }

  public async findPermsByUserId(user_id: number): Promise<string[]> {
    return await this.sysMenuRepository.selectPermsByUserId(user_id);
  }

  public async findByRoleId(role_id: number): Promise<number[]> {
    const roles = await this.sysRoleRepository.selectByIds([role_id]);
    const role = roles[0];
    if (role?.id !== role_id) {
      return [];
    }
    return await this.sysMenuRepository.selectByRoleId(
      role.id,
      role.role_menu_check_strictly === '1'
    );
  }

  public async buildTreeMenusByUserId(user_id: number): Promise<SysMenu[]> {
    const rows = await this.sysMenuRepository.selectTreeByUserId(user_id);
    return this.parseDataToTree(rows);
  }

  public async buildTreeSelectByUserId(
    sysMenu: SysMenu,
    user_id: number
  ): Promise<TreeSelect[]> {
    const rows = await this.sysMenuRepository.select(sysMenu, user_id);
    return this.parseDataToTree(rows).map(sysMenuTreeSelect);
  }

  private parseDataToTree(rows: SysMenu[]): SysMenu[] {
    const nodesMap = new Map<number, SysMenu[]>();
    const treeIds = new Set<number>();
    for (const item of rows) {
      const children = nodesMap.get(item.parent_id) ?? [];
      children.push(item);
      nodesMap.set(item.parent_id, children);
      treeIds.add(item.id);
    }

    const tree: SysMenu[] = [];
    for (const [parent_id, children] of nodesMap) {
      if (!treeIds.has(parent_id)) {
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
      menu.title = item.menu_name;
      menu.path = item.menu_path;
      menu.icon = item.menu_icon === '#' ? '' : item.menu_icon;
      menu.hidden = item.menu_visible === STATUS_NO;
      menu.cache = item.menu_cache === STATUS_YES;
      menu.children = [];
      if (menu.kind === 'external') {
        menu.target = '_blank';
      }
      if (menu.kind === 'page') {
        menu.component = item.menu_component;
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        menu.children = this.buildAuthMenus(item.children);
      }
      return menu;
    });
  }

  private getAuthMenuKind(sysMenu: SysMenu): AuthMenu['kind'] {
    if (validHttp(sysMenu.menu_path)) {
      return sysMenu.menu_external === STATUS_YES ? 'external' : 'iframe';
    }
    if (sysMenu.menu_type === MENU_TYPE_DIR) {
      return 'directory';
    }
    return 'page';
  }

  private normalizeMenuFields(sysMenu: SysMenu): void {
    if (!sysMenu.menu_icon) {
      sysMenu.menu_icon = '#';
    }
    if (sysMenu.menu_type === MENU_TYPE_AUTH) {
      sysMenu.menu_component = '';
      sysMenu.menu_external = '0';
      sysMenu.menu_cache = '1';
      sysMenu.menu_visible = '1';
      sysMenu.menu_path = '';
      sysMenu.menu_icon = '#';
    } else if (sysMenu.menu_type === MENU_TYPE_DIR) {
      sysMenu.menu_component = '';
      sysMenu.menu_cache = '1';
      sysMenu.menu_perms = '';
    }
    if (sysMenu.menu_type === MENU_TYPE_MENU && validHttp(sysMenu.menu_path)) {
      sysMenu.menu_component = '';
      sysMenu.menu_perms = '';
    }
  }
}
