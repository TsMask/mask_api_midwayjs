import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { SysUserRole } from '../../model/SysUserRole';
import { ISysUserRoleRepository } from '../ISysUserRoleRepository';

/**
 * 用户与角色关联表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysUserRoleRepositoryImpl implements ISysUserRoleRepository {
  @Inject()
  public db: MysqlManager;

  async deleteUserRoleByUserId(userId: string): Promise<number> {
    const sqlStr = 'delete from sys_user_role where user_id = ?';
    const result: ResultSetHeader = await this.db.execute(sqlStr, [userId]);
    return result.affectedRows;
  }
  async deleteUserRole(userIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_user_role where user_id in (${userIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, userIds);
    return result.affectedRows;
  }
  countUserRoleByRoleId(roleId: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
  async batchUserRole(sysUserRoles: SysUserRole[]): Promise<number> {
    const sqlStr = `insert into sys_user_role(user_id, role_id) values ${sysUserRoles
      .map(item => `(${item.userId},${item.roleId})`)
      .join(',')}`;
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.insertId;
  }
  deleteUserRoleInfo(sysUserRole: SysUserRole): Promise<number> {
    throw new Error('Method not implemented.');
  }
  deleteUserRoleInfos(roleId: string, userIds: string[]): Promise<number> {
    throw new Error('Method not implemented.');
  }
}
