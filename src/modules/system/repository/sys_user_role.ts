import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysUserRole } from '../model/sys_user_role';

/**用户与角色关联表 数据层处理 */
@Provide()
@Singleton()
export class SysUserRoleRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 存在用户使用数量
   * @param roleId 角色ID
   * @returns 数量
   */
  public async existUserByRoleId(roleId: number): Promise<number> {
    if (roleId <= 0) {
      return 0;
    }
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUserRole, 's')
      .andWhere('s.role_id = :roleId', { roleId })
      .getCount();
    return count;
  }

  /**
   * 批量删除关联By用户
   *
   * @param userIds ID数组
   * @return 影响记录数
   */
  public async deleteByUserIds(userIds: number[]): Promise<number> {
    if (userIds.length <= 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysUserRole)
      .andWhere('user_id in (:userIds)', { userIds })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除关联By角色
   *
   * @param roleId 角色ID
   * @param userIds ID数组
   * @return 影响记录数
   */
  public async deleteByRoleId(
    roleId: number,
    userIds: number[]
  ): Promise<number> {
    if (roleId <= 0 || userIds.length <= 0) return 0;
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysUserRole)
      .andWhere('role_id = :roleId', { roleId })
      .andWhere('user_id in (:userIds)', { userIds })
      .execute();
    return tx.affected;
  }

  /**
   * 批量新增信息
   *
   * @param sysUserRoles 信息
   * @return 影响记录数
   */
  public async batchInsert(sysUserRoles: SysUserRole[]): Promise<number> {
    if (sysUserRoles.length <= 0) return 0;
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysUserRole)
      .values(sysUserRoles)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.affectedRows > 0) {
      return raw.affectedRows;
    }
    return 0;
  }
}
