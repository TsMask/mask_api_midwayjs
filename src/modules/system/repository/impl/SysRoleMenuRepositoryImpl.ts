import { Provide, Inject, Singleton } from '@midwayjs/decorator';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysRoleMenu } from '../../model/SysRoleMenu';
import { ISysRoleMenuRepository } from '../ISysRoleMenuRepository';
import { ResultSetHeader } from 'mysql2';

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
    const sqlStr = `delete from sys_role_menu where role_id in (${roleIds
      .map(() => '?')
      .join(',')})`;
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
