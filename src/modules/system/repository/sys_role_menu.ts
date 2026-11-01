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

  public async existRoleByMenuId(menu_id: number): Promise<number> {
    if (menu_id <= 0) {
      return 0;
    }
    const count = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRoleMenu, 's')
      .andWhere('s.menu_id = :menu_id', { menu_id })
      .getCount();
    return count;
  }

  public async deleteByRoleIds(
    role_ids: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (role_ids.length <= 0) return 0;
    if (entityManager) {
      const result: DeleteResult = await entityManager.delete(SysRoleMenu, {
        role_id: In(role_ids),
      });
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysRoleMenu)
      .andWhere('role_id in (:role_ids)', { role_ids })
      .execute();
    return tx.affected ?? 0;
  }

  public async deleteByMenuIds(
    menu_ids: number[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (menu_ids.length <= 0) return 0;
    if (entityManager) {
      const result: DeleteResult = await entityManager.delete(SysRoleMenu, {
        menu_id: In(menu_ids),
      });
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysRoleMenu)
      .andWhere('menu_id in (:menu_ids)', { menu_ids })
      .execute();
    return tx.affected ?? 0;
  }

  public async batchInsert(
    sysRoleMenus: SysRoleMenu[],
    entityManager?: EntityManager
  ): Promise<number> {
    if (sysRoleMenus.length <= 0) return 0;
    if (entityManager) {
      const result: InsertResult = await entityManager.insert(
        SysRoleMenu,
        sysRoleMenus
      );
      const raw: ResultSetHeader = result.raw;
      return raw.affectedRows > 0 ? raw.affectedRows : 0;
    }
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
