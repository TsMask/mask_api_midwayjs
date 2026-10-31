import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, EntityManager, In, InsertResult } from 'typeorm';
import { ResultSetHeader } from '../../../typings/commont';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysRoleMenu } from '../model/sys_role_menu';

/** Role-menu relation data access. */
@Provide()
@Singleton()
export class SysRoleMenuRepository {
  @Inject()
  private db: DynamicDataSource;

  public async existRoleByMenuId(menuId: number): Promise<number> {
    if (menuId <= 0) {
      return 0;
    }
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRoleMenu, 's')
      .andWhere('s.menu_id = :menuId', { menuId })
      .getCount();
    return count;
  }

  public async deleteByRoleIds(roleIds: number[]): Promise<number> {
    if (roleIds.length <= 0) return 0;
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysRoleMenu)
      .andWhere('role_id in (:roleIds)', { roleIds })
      .execute();
    return tx.affected ?? 0;
  }

  public async deleteByMenuIds(
    menuIds: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (menuIds.length <= 0) return 0;
    if (entityManager) {
      const result: DeleteResult = await entityManager.delete(SysRoleMenu, {
        menuId: In(menuIds),
      });
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysRoleMenu)
      .andWhere('menu_id in (:menuIds)', { menuIds })
      .execute();
    return tx.affected ?? 0;
  }

  public async batchInsert(sysRoleMenus: SysRoleMenu[]): Promise<number> {
    if (sysRoleMenus.length <= 0) return 0;
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysRoleMenu)
      .values(sysRoleMenus)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.affectedRows > 0) {
      return raw.affectedRows;
    }
    return 0;
  }
}
