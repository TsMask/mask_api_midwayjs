import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, EntityManager, In, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysUserRole } from '../model/sys_user_role';

/**用户与角色关联表 数据层处理 */
@Provide()
@Singleton()
export class SysUserRoleRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 存在用户使用数量
   * @param role_id 角色ID
   * @returns 数量
   */
  public async existUserByRoleId(role_id: number): Promise<number> {
    if (role_id <= 0) {
      return 0;
    }
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUserRole, 's')
      .andWhere('s.role_id = :role_id', { role_id })
      .getCount();
    return count;
  }

  /**
   * 通过角色ID数组查询关联的用户ID（去重）
   * @param role_ids 角色ID数组
   * @returns 用户ID数组
   */
  public async selectUserIdsByRoleIds(role_ids: number[]): Promise<number[]> {
    if (role_ids.length === 0) {
      return [];
    }
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('DISTINCT s.user_id', 'user_id')
      .from(SysUserRole, 's')
      .andWhere('s.role_id IN (:...role_ids)', { role_ids })
      .getRawMany();
    return rows.map(row => Number(row.user_id));
  }

  /**
   * 通过用户ID数组删除关联角色
   * @param userIds 用户ID数组
   * @param entityManager 事务EntityManager（可选）
   * @returns 影响记录数
   */
  public async deleteByUserIds(
    userIds: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (userIds.length <= 0) {
      return 0;
    }
    if (entityManager) {
      const result: DeleteResult = await entityManager.delete(SysUserRole, {
        user_id: In(userIds),
      });
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysUserRole)
      .andWhere('user_id IN (:...userIds)', { userIds })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量删除关联By角色
   *
   * @param role_id 角色ID
   * @param userIds ID数组
   * @return 影响记录数
   */
  public async deleteByRoleId(
    role_id: number,
    userIds: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (role_id <= 0 || userIds.length <= 0) return 0;
    if (entityManager) {
      const result: DeleteResult = await entityManager.delete(SysUserRole, {
        role_id: role_id,
        user_id: In(userIds),
      });
      return result.affected ?? 0;
    }
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysUserRole)
      .andWhere('role_id = :role_id', { role_id })
      .andWhere('user_id in (:userIds)', { userIds })
      .execute();
    return tx.affected ?? 0;
  }

  /**
   * 批量新增
   * @param sysUserRoles 用户角色关联数组
   * @param entityManager 事务EntityManager（可选）
   * @returns 影响记录数
   */
  public async batchInsert(
    sysUserRoles: SysUserRole[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (sysUserRoles.length <= 0) {
      return 0;
    }
    if (entityManager) {
      const result: InsertResult = await entityManager.insert(
        SysUserRole,
        sysUserRoles
      );
      return result.raw.affectedRows > 0 ? result.raw.affectedRows : 0;
    }
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysUserRole)
      .values(sysUserRoles)
      .execute();
    return tx.raw.affectedRows > 0 ? tx.raw.affectedRows : 0;
  }
}
