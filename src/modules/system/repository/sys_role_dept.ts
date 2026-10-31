import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, EntityManager, InsertResult } from 'typeorm';
import { ResultSetHeader } from '../../../typings/commont';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysRoleDept } from '../model/sys_role_dept';

/**角色与部门关联表 数据层处理 */
@Provide()
@Singleton()
export class SysRoleDeptRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 批量删除信息By角色
   *
   * @param roleIds ID数组
   * @return 影响记录数
   */
  public async deleteByRoleIds(roleIds: number[]): Promise<number> {
    if (roleIds.length <= 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysRoleDept)
      .andWhere('role_id in (:roleIds)', { roleIds })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量删除信息By部门
   *
   * @param deptIds ID数组
   * @return 影响记录数
   */
  public async deleteByDeptIds(
    deptIds: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (deptIds.length <= 0) return 0;
    const run = async (manager: EntityManager) => {
      const tx: DeleteResult = await manager
        .createQueryBuilder()
        .delete()
        .from(SysRoleDept)
        .where('dept_id in (:deptIds)', { deptIds })
        .execute();
      return tx.affected ?? 0;
    };
    if (entityManager) {
      return await run(entityManager);
    }
    return await this.db.transaction('', run);
  }

  /**
   * 批量新增信息
   *
   * @param sysRoleDepts 信息
   * @return 影响记录数
   */
  public async batchInsert(sysRoleDepts: SysRoleDept[]): Promise<number> {
    if (sysRoleDepts.length <= 0) return 0;
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysRoleDept)
      .values(sysRoleDepts)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.affectedRows > 0) {
      return raw.affectedRows;
    }
    return 0;
  }
}
