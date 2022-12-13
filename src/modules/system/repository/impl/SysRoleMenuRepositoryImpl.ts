import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { SysRoleMenu } from '../../model/SysRoleMenu';
import { ISysRoleMenuRepository } from '../ISysRoleMenuRepository';

/**
 * 角色与菜单关联表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysRoleMenuRepositoryImpl implements ISysRoleMenuRepository {
  @Inject()
  public db: MysqlManager;

  async checkMenuExistRole(menuId: string): Promise<number> {
    const sqlStr =
      "select count(1) as 'total' from sys_role_menu where menu_id = ? ";
    const countRow: rowTotal[] = await this.db.execute(sqlStr, [menuId]);
    return countRow[0].total;
  }
  async deleteRoleMenuByRoleId(roleId: string): Promise<number> {
    const sqlStr = 'delete from sys_role_menu where role_id = ?';
    const result: ResultSetHeader = await this.db.execute(sqlStr, [roleId]);
    return result.affectedRows;
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
