import { Provide, Inject, Singleton } from '@midwayjs/core';
import { ResultSetHeader } from 'mysql2';
import { DynamicDataSource } from '../../../../framework/datasource/DynamicDataSource';
import { ISysRoleDeptRepository } from '../ISysRoleDeptRepository';
import { SysRoleDept } from '../../model/SysRoleDept';

/**
 * 角色与部门关联表 数据层处理
 *
 * @author TsMask
 */
@Provide()
@Singleton()
export class SysRoleDeptRepositoryImpl implements ISysRoleDeptRepository {
  @Inject()
  public db: DynamicDataSource;

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
