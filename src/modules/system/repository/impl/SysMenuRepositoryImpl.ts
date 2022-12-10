import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { SysMenu } from '../../../../framework/core/model/SysMenu';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { ISysMenuRepository } from '../ISysMenuRepository';

/**查询视图对象SQL */
const SELECT_MENU_VO = `select 
menu_id, menu_name, parent_id, order_num, path, component, query, is_frame, is_cache, menu_type, visible, status, ifnull(perms,'') as perms, icon, create_time 
from sys_menu`;

/**菜单权限表信息实体映射 */
const SYS_MENU_RESULT = new Map<string, string>();
SYS_MENU_RESULT.set('menu_id', 'menuId');
SYS_MENU_RESULT.set('menu_name', 'menuName');
SYS_MENU_RESULT.set('parent_name', 'parentName');
SYS_MENU_RESULT.set('parent_id', 'parentId');
SYS_MENU_RESULT.set('order_num', 'orderNum');
SYS_MENU_RESULT.set('path', 'path');
SYS_MENU_RESULT.set('component', 'component');
SYS_MENU_RESULT.set('query', 'query');
SYS_MENU_RESULT.set('is_frame', 'isFrame');
SYS_MENU_RESULT.set('is_cache', 'isCache');
SYS_MENU_RESULT.set('menu_type', 'menuType');
SYS_MENU_RESULT.set('visible', 'visible');
SYS_MENU_RESULT.set('status', 'status');
SYS_MENU_RESULT.set('perms', 'perms');
SYS_MENU_RESULT.set('icon', 'icon');
SYS_MENU_RESULT.set('create_by', 'createBy');
SYS_MENU_RESULT.set('create_time', 'createTime');
SYS_MENU_RESULT.set('update_by', 'updateBy');
SYS_MENU_RESULT.set('update_time', 'updateTime');
SYS_MENU_RESULT.set('remark', 'remark');

/**
 *将结果记录转实体结果组
 * @param rows 查询结果记录
 * @returns 实体组
 */
function parseSysMenuResult(rows: any[]): SysMenu[] {
  const sysMenus: SysMenu[] = [];
  for (const row of rows) {
    const sysMenu = new SysMenu();
    for (const key in row) {
      if (SYS_MENU_RESULT.has(key)) {
        const keyMapper = SYS_MENU_RESULT.get(key);
        sysMenu[keyMapper] = row[key];
      }
    }
    sysMenus.push(sysMenu);
  }
  return sysMenus;
}

/**
 * 菜单表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysMenuRepositoryImpl implements ISysMenuRepository {
  @Inject()
  public db: MysqlManager;

  selectMenuList(sysMenu: SysMenu): Promise<SysMenu[]> {
    throw new Error('Method not implemented.');
  }
  selectMenuPerms(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async selectMenuListByUserId(sysMenu: SysMenu): Promise<SysMenu[]> {
    let sqlStr = `select 
    distinct m.menu_id, m.parent_id, m.menu_name, m.path, m.component, 
    m.query, m.visible, m.status, ifnull(m.perms,'') as perms, m.is_frame, 
    m.is_cache, m.menu_type, m.icon, m.order_num, m.create_time
		from sys_menu m
		left join sys_role_menu rm on m.menu_id = rm.menu_id
		left join sys_user_role ur on rm.role_id = ur.role_id
		left join sys_role ro on ur.role_id = ro.role_id
		where 1 = 1 `;
    const paramArr = [];
    if (sysMenu.menuId) {
      sqlStr += " and m.menu_name like concat('%', ?, '%') ";
      paramArr.push(sysMenu.menuId);
    }
    if (sysMenu.visible) {
      sqlStr += ' and m.visible = ? ';
      paramArr.push(sysMenu.visible);
    }
    if (sysMenu.status) {
      sqlStr += ' and m.status = ? ';
      paramArr.push(sysMenu.status);
    }
    sqlStr += ' order by m.parent_id, m.order_num ';
    const rows = await this.db.execute(sqlStr, paramArr);
    return parseSysMenuResult(rows);
  }

  async selectMenuPermsByRoleId(roleId: string): Promise<string[]> {
    const sqlStr = `select distinct m.perms as 'perms' from sys_menu m 
    left join sys_role_menu rm on m.menu_id = rm.menu_id
    where m.status = '0' and rm.role_id = ?`;

    const rows: { perms: string }[] = await this.db.execute(sqlStr, [roleId]);
    return rows.map(v => v.perms);
  }

  async selectMenuPermsByUserId(userId: string): Promise<string[]> {
    const sqlStr = `select distinct m.perms from sys_menu m 
    left join sys_role_menu rm on m.menu_id = rm.menu_id 
    left join sys_user_role ur on rm.role_id = ur.role_id 
    left join sys_role r on r.role_id = ur.role_id
		where m.status = '0' and r.status = '0' and ur.user_id = ? `;

    return await this.db.execute(sqlStr, [userId]);
  }

  async selectMenuTreeAll(): Promise<SysMenu[]> {
    const sqlStr = `select 
    distinct m.menu_id, m.parent_id, m.menu_name, m.path, m.component, m.query, 
    m.visible, m.status, ifnull(m.perms,'') as perms, m.is_frame, 
    m.is_cache, m.menu_type, m.icon, m.order_num, m.create_time
		from sys_menu m where m.menu_type in ('M', 'C') and m.status = 0
		order by m.parent_id, m.order_num`;

    const rows = await this.db.execute(sqlStr);
    return parseSysMenuResult(rows);
  }

  async selectMenuTreeByUserId(userId: string): Promise<SysMenu[]> {
    const sqlStr = `select distinct m.menu_id, m.parent_id, m.menu_name, m.path, m.component, 
    m.query, m.visible, m.status, ifnull(m.perms,'') as perms, m.is_frame, m.is_cache, m.menu_type, m.icon, m.order_num, m.create_time
    from sys_menu m
    left join sys_role_menu rm on m.menu_id = rm.menu_id
    left join sys_user_role ur on rm.role_id = ur.role_id
    left join sys_role ro on ur.role_id = ro.role_id
    left join sys_user u on ur.user_id = u.user_id
    where u.user_id = ? and m.menu_type in ('M', 'C') and m.status = 0  AND ro.status = 0
    order by m.parent_id, m.order_num`;

    const rows = await this.db.execute(sqlStr, [userId]);
    return parseSysMenuResult(rows);
  }

  selectMenuListByRoleId(
    roleId: string,
    menuCheckStrictly: boolean
  ): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  async selectMenuById(menuId: string): Promise<SysMenu> {
    const sqlStr = `${SELECT_MENU_VO} where menu_id = ?`;
    const rows = await this.db.execute(sqlStr, [menuId]);
    return parseSysMenuResult(rows)[0] || null;
  }

  hasChildByMenuId(menuId: string): Promise<number> {
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
  checkUniqueMenuName(menuName: string, parentId: string): Promise<SysMenu> {
    throw new Error('Method not implemented.');
  }
}
