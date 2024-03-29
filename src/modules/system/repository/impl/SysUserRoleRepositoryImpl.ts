import { Provide, Inject, Singleton } from '@midwayjs/core';
import { ResultSetHeader } from 'mysql2';
import { parseNumber } from '../../../../framework/utils/ValueParseUtils';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { SysUserRole } from '../../model/SysUserRole';
import { ISysUserRoleRepository } from '../ISysUserRoleRepository';

/**
 * 用户与角色关联表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysUserRoleRepositoryImpl implements ISysUserRoleRepository {
  @Inject()
  public db: DynamicDataSource;

  async countUserRoleByRoleId(roleId: string): Promise<number> {
    const sqlStr =
      'select count(1) as total from sys_user_role where role_id = ?';
    const countRow: RowTotalType[] = await this.db.execute(sqlStr, [roleId]);
    return parseNumber(countRow[0].total);
  }

  async batchUserRole(sysUserRoles: SysUserRole[]): Promise<number> {
    const sqlStr = `insert into sys_user_role(user_id, role_id) values ${sysUserRoles
      .map(item => `(${item.userId},${item.roleId})`)
      .join(',')}`;
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.affectedRows;
  }

  async deleteUserRole(userIds: string[]): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(userIds.length);
    const sqlStr = `delete from sys_user_role where user_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, userIds);
    return result.affectedRows;
  }

  async deleteUserRoleByRoleId(
    roleId: string,
    userIds: string[]
  ): Promise<number> {
    const placeholder = this.db.keyPlaceholderByQuery(userIds.length);
    const sqlStr = `delete from sys_user_role where role_id= ? and user_id in (${placeholder})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, [
      roleId,
      ...userIds,
    ]);
    return result.affectedRows;
  }
}
