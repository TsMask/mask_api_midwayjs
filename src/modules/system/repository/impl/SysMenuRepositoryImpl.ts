import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysMenuRepository } from '../ISysMenuRepository';
import { SysMenu } from '../../model/SysMenu';

/**查询视图对象SQL */
const SELECT_MENU_VO = `select 
m.menu_id, m.menu_name, m.parent_id, m.order_num, m.path, m.component, m.query, m.is_frame, m.is_cache, m.menu_type, m.visible, m.status, ifnull(m.perms,'') as perms,  m.icon,  m.create_time 
from sys_menu m`;

/**查询视图用户对象SQL */
const SELECT_MENU_USER_VO = `select distinct 
m.menu_id, m.parent_id, m.menu_name, m.path, m.component, m.query, m.visible, m.status, ifnull(m.perms,'') as perms, m.is_frame, m.is_cache, m.menu_type, m.icon, m.order_num, m.create_time
from sys_menu m
left join sys_role_menu rm on m.menu_id = rm.menu_id
left join sys_user_role ur on rm.role_id = ur.role_id
left join sys_role ro on ur.role_id = ro.role_id`;

/**菜单权限表信息实体映射 */
const SYS_MENU_RESULT = new Map<string, string>();
SYS_MENU_RESULT.set('menu_id', 'menuId');
SYS_MENU_RESULT.set('menu_name', 'menuName');
SYS_MENU_RESULT.set('parent_name', 'parentName');
SYS_MENU_RESULT.set('parent_id', 'parentId');
SYS_MENU_RESULT.set('path', 'path');
SYS_MENU_RESULT.set('order_num', 'orderNum');
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
 * @author TsMask
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysMenuRepositoryImpl implements ISysMenuRepository {
  @Inject()
  public db: DynamicDataSource;

  async selectMenuList(sysMenu: SysMenu, userId?: string): Promise<SysMenu[]> {
    let sqlStr = '';
    const paramArr = [];
    if (sysMenu.menuName) {
      sqlStr += " and m.menu_name like concat('%', ?, '%') ";
      paramArr.push(sysMenu.menuName);
    }
    if (sysMenu.visible) {
      sqlStr += ' and m.visible = ? ';
      paramArr.push(sysMenu.visible);
    }
    if (sysMenu.status) {
      sqlStr += ' and m.status = ? ';
      paramArr.push(sysMenu.status);
    }

    let buildSqlStr = `${SELECT_MENU_VO} where 1 = 1 ${sqlStr} order by m.parent_id, m.order_num`;
    if (userId && userId !== '0') {
      sqlStr += ' and ur.user_id = ? ';
      paramArr.push(userId);
      buildSqlStr = `${SELECT_MENU_USER_VO} where 1 = 1 ${sqlStr} order by m.parent_id, m.order_num`;
    }
    const rows = await this.db.execute(buildSqlStr, paramArr);
    return parseSysMenuResult(rows);
  }

  async selectMenuTreeByUserId(userId?: string): Promise<SysMenu[]> {
    const paramArr = [];
    let buildSqlStr = `${SELECT_MENU_VO} where 
    m.menu_type in ('M', 'C') and m.status = '1'
		order by m.parent_id, m.order_num`;

    if (userId && userId !== '0') {
      buildSqlStr = `${SELECT_MENU_USER_VO} where 
      m.menu_type in ('M', 'C') and m.status = '1'
      and ur.user_id = ? and ro.status = '1'
      order by m.parent_id, m.order_num`;
      paramArr.push(userId);
    }

    const rows = await this.db.execute(buildSqlStr, paramArr);
    return parseSysMenuResult(rows);
  }

  selectMenuPerms(): Promise<number[]> {
    throw new Error('Method not implemented.');
  }

  async selectMenuPermsByRoleId(roleId: string): Promise<string[]> {
    const sqlStr = `select distinct m.perms as 'str' from sys_menu m 
    left join sys_role_menu rm on m.menu_id = rm.menu_id
    where m.status = '1' and rm.role_id = ?`;

    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, [roleId]);
    return rows.map(item => item.str);
  }

  async selectMenuPermsByUserId(userId: string): Promise<string[]> {
    const sqlStr = `select distinct m.perms as 'str' from sys_menu m 
    left join sys_role_menu rm on m.menu_id = rm.menu_id 
    left join sys_user_role ur on rm.role_id = ur.role_id 
    left join sys_role r on r.role_id = ur.role_id
		where m.status = '1' and r.status = '1' and ur.user_id = ? `;

    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, [userId]);
    return rows.map(item => item.str);
  }

  async selectMenuListByRoleId(
    roleId: string,
    menuCheckStrictly: boolean
  ): Promise<string[]> {
    let sqlStr = `select m.menu_id as 'str' from sys_menu m 
    left join sys_role_menu rm on m.menu_id = rm.menu_id
    where rm.role_id = ?`;
    const paramArr = [roleId];
    if (menuCheckStrictly) {
      sqlStr +=
        ' and m.menu_id not in (select m.parent_id from sys_menu m inner join sys_role_menu rm on m.menu_id = rm.menu_id and rm.role_id = ?) ';
      paramArr.push(roleId);
    }
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, paramArr);
    return rows.map(item => item.str);
  }

  async selectMenuById(menuId: string): Promise<SysMenu> {
    const sqlStr = `${SELECT_MENU_VO} where menu_id = ?`;
    const rows = await this.db.execute(sqlStr, [menuId]);
    return parseSysMenuResult(rows)[0] || null;
  }

  async hasChildByMenuId(menuId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_menu where parent_id = ? ";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [menuId]);
    return parseNumber(countRow[0].total);
  }

  async checkMenuExistRole(menuId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_role_menu where menu_id = ? ";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [menuId]);
    return parseNumber(countRow[0].total);
  }

  async insertMenu(sysMenu: SysMenu): Promise<string> {
    const paramMap = new Map();
    if (sysMenu.menuId) {
      paramMap.set('menu_id', sysMenu.menuId);
    }
    if (sysMenu.parentId && sysMenu.parentId !== '0') {
      paramMap.set('parent_id', sysMenu.parentId);
    }
    if (sysMenu.menuName) {
      paramMap.set('menu_name', sysMenu.menuName);
    }
    if (sysMenu.orderNum >= 0) {
      paramMap.set('order_num', parseNumber(sysMenu.orderNum));
    }
    if (sysMenu.path) {
      paramMap.set('path', sysMenu.path);
    }
    if (sysMenu.component) {
      paramMap.set('component', sysMenu.component);
    }
    if (sysMenu.query) {
      paramMap.set('query', sysMenu.query);
    }
    if (sysMenu.isFrame) {
      paramMap.set('is_frame', parseNumber(sysMenu.isFrame));
    }
    if (sysMenu.isCache) {
      paramMap.set('is_cache', parseNumber(sysMenu.isCache));
    }
    if (sysMenu.menuType) {
      paramMap.set('menu_type', sysMenu.menuType);
    }
    if (sysMenu.visible) {
      paramMap.set('visible', parseNumber(sysMenu.visible));
    }
    if (sysMenu.status) {
      paramMap.set('status', parseNumber(sysMenu.status));
    }
    if (sysMenu.perms) {
      paramMap.set('perms', sysMenu.perms);
    }
    if (sysMenu.icon) {
      paramMap.set('icon', sysMenu.icon);
    }
    if (sysMenu.remark) {
      paramMap.set('remark', sysMenu.remark);
    }
    if (sysMenu.createBy) {
      paramMap.set('create_by', sysMenu.createBy);
      paramMap.set('create_time', Date.now());
    }

    const sqlStr = `insert into sys_menu (${[...paramMap.keys()].join(
      ','
    )})values(${Array.from({ length: paramMap.size }, () => '?').join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
    ]);
    return `${result.insertId}`;
  }

  async updateMenu(sysMenu: SysMenu): Promise<number> {
    const paramMap = new Map();
    if (sysMenu.parentId && sysMenu.parentId !== '0') {
      paramMap.set('parent_id', sysMenu.parentId);
    }
    if (sysMenu.menuName) {
      paramMap.set('menu_name', sysMenu.menuName);
    }
    if (sysMenu.orderNum >= 0) {
      paramMap.set('order_num', parseNumber(sysMenu.orderNum));
    }
    if (sysMenu.path) {
      paramMap.set('path', sysMenu.path);
    }
    if (sysMenu.component) {
      paramMap.set('component', sysMenu.component);
    }
    if (sysMenu.query) {
      paramMap.set('query', sysMenu.query);
    }
    if (sysMenu.isFrame) {
      paramMap.set('is_frame', parseNumber(sysMenu.isFrame));
    }
    if (sysMenu.isCache) {
      paramMap.set('is_cache', parseNumber(sysMenu.isCache));
    }
    if (sysMenu.menuType) {
      paramMap.set('menu_type', sysMenu.menuType);
    }
    if (sysMenu.visible) {
      paramMap.set('visible', parseNumber(sysMenu.visible));
    }
    if (sysMenu.status) {
      paramMap.set('status', parseNumber(sysMenu.status));
    }
    if (sysMenu.perms) {
      paramMap.set('perms', sysMenu.perms);
    }
    if (sysMenu.icon) {
      paramMap.set('icon', sysMenu.icon);
    }
    if (sysMenu.remark) {
      paramMap.set('remark', sysMenu.remark);
    }
    if (sysMenu.updateBy) {
      paramMap.set('update_by', sysMenu.updateBy);
      paramMap.set('update_time', Date.now());
    }

    const sqlStr = `update sys_menu set ${[...paramMap.keys()]
      .map(k => `${k} = ?`)
      .join(', ')} where menu_id = ?`;
    const rows: ResultSetHeader = await this.db.execute(sqlStr, [
      ...paramMap.values(),
      sysMenu.menuId,
    ]);
    return rows.affectedRows;
  }

  async deleteMenuById(menuId: string): Promise<number> {
    const sqlStr = 'delete from sys_menu where menu_id = ?';
    const result: ResultSetHeader = await this.db.execute(sqlStr, [menuId]);
    return result.affectedRows;
  }

  async checkUniqueMenuName(
    menuName: string,
    parentId: string
  ): Promise<string> {
    const sqlStr =
      "select menu_id as 'str' from sys_menu where menu_name = ? and parent_id = ? limit 1";
    const rows: RowOneColumnType[] = await this.db.execute(sqlStr, [
      menuName,
      parentId,
    ]);
    return rows.length > 0 ? rows[0].str : null;
  }
}
