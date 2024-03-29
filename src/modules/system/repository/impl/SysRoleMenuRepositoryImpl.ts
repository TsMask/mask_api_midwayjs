import { Provide, Inject, Singleton } from '@midwayjs/core';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysRoleMenuRepository } from '../ISysRoleMenuRepository';
import { SysRoleMenu } from '../../model/SysRoleMenu';

/**
 * 角色与菜单关联表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysRoleMenuRepositoryImpl implements ISysRoleMenuRepository {
  @Inject()
  public db: DynamicDataSource;

  async checkMenuExistRole(menuId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_role_menu where menu_id = ?";
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [menuId]);
    return parseNumber(countRow[0].total);
  }

  async deleteRoleMenu(roleIds: string[]): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(roleIds.length);
    const sqlStr = `delete from sys_role_menu where role_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, roleIds);
    return result.affectedRows;
  }

  async batchRoleMenu(sysRoleMenus: SysRoleMenu[]): Promise<number> {
    const sqlStr = `insert into sys_role_menu(role_id, menu_id) values ${sysRoleMenus
      .map(item => `(${item.roleId},${item.menuId})`)
      .join(',')}`;
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.affectedRows;
  }
}
