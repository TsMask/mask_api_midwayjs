import { Provide, Inject, Scope, ScopeEnum } from '@midwayjs/decorator';
import { ResultSetHeader } from 'mysql2';
import { MysqlManager } from '../../../../framework/data_source/MysqlManager';
import { SysRoleDept } from '../../model/SysRoleDept';
import { ISysRoleDeptRepository } from '../ISysRoleDeptRepository';

/**
 * 角色与部门关联表 数据层处理
 *
 * @author TsMask <340112800@qq.com>
 */
@Provide()
@Scope(ScopeEnum.Singleton)
export class SysRoleDeptRepositoryImpl implements ISysRoleDeptRepository {
  @Inject()
  public db: MysqlManager;

  async deleteRoleDept(roleIds: string[]): Promise<number> {
    const sqlStr = `delete from sys_role_dept where role_id in (${roleIds
      .map(() => '?')
      .join(',')})`;
    const result: ResultSetHeader = await this.db.execute(sqlStr, roleIds);
    return result.affectedRows;
  }

  async batchRoleDept(sysRoleDepts: SysRoleDept[]): Promise<number> {
    const sqlStr = `insert into sys_role_dept(role_id, dept_id) values ${sysRoleDepts
      .map(item => `(${item.roleId},${item.deptId})`)
      .join(',')}`;
    const result: ResultSetHeader = await this.db.execute(sqlStr);
    return result.affectedRows;
  }
}