import { Inject, Provide, Singleton } from '@midwayjs/core';
import {
  DeleteResult,
  EntityManager,
  InsertResult,
  UpdateResult,
} from 'typeorm';

import { ResultSetHeader } from '../../../typings/commont';
import {
  MENU_TYPE_DIR,
  MENU_TYPE_MENU,
} from '../../../internal/shared/constants/menu';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysMenu } from '../model/sys_menu';

/** Menu data access. */
@Provide()
@Singleton()
export class SysMenuRepository {
  @Inject()
  private db: DynamicDataSource;

  public async select(
    sysMenu: SysMenu,
    userId: number
  ): Promise<SysMenu[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.menu_del = '0'");
    if (sysMenu.menuName) {
      tx.andWhere('s.menu_name like :menuName', {
        menuName: sysMenu.menuName + '%',
      });
    }
    if (sysMenu.menuVisible) {
      tx.andWhere('s.menu_visible = :menuVisible', {
        menuVisible: sysMenu.menuVisible,
      });
    }
    if (sysMenu.menuStatus) {
      tx.andWhere('s.menu_status = :menuStatus', {
        menuStatus: sysMenu.menuStatus,
      });
    }
    if (userId > 0) {
      tx.andWhere(
        `s.id in (
          select menu_id from sys_role_menu where role_id in (
          select role_id from sys_user_role where user_id = :userId
          ))`,
        { userId }
      );
    }
    return await tx
      .addOrderBy('s.parent_id', 'ASC')
      .addOrderBy('s.menu_sort', 'ASC')
      .getMany();
  }

  public async selectByIds(menuIds: number[]): Promise<SysMenu[]> {
    if (menuIds.length <= 0) {
      return [];
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.id in (:menuIds) and s.menu_del = '0'", { menuIds })
      .getMany();
  }

  public async insert(
    sysMenu: SysMenu,
    entityManager?: EntityManager
  ): Promise<number> {
    sysMenu.menuDel = '0';
    if (sysMenu.id > 0) {
      return 0;
    }
    if (entityManager) {
      const result: InsertResult = await entityManager.insert(SysMenu, sysMenu);
      const raw: ResultSetHeader = result.raw;
      return raw.insertId > 0 ? raw.insertId : 0;
    }
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysMenu)
      .values(sysMenu)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    return raw.insertId > 0 ? raw.insertId : 0;
  }

  public async update(
    sysMenu: SysMenu,
    entityManager?: EntityManager
  ): Promise<number> {
    if (sysMenu.id <= 0) {
      return 0;
    }
    const data = Object.assign({}, sysMenu);
    delete (data as Partial<SysMenu>).id;
    delete (data as Partial<SysMenu>).menuDel;
    delete (data as Partial<SysMenu>).createBy;
    delete (data as Partial<SysMenu>).createTime;
    delete (data as Partial<SysMenu>).children;
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysMenu,
        sysMenu.id,
        data
      );
      return result.affected ?? 0;
    }
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysMenu)
      .set(data)
      .andWhere('id = :id', { id: sysMenu.id })
      .execute();
    return tx.affected ?? 0;
  }

  public async deleteById(
    menuId: number,
    entityManager?: EntityManager
  ): Promise<number> {
    if (menuId <= 0) return 0;
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysMenu,
        { id: menuId },
        { menuDel: '1' }
      );
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysMenu)
      .set({ menuDel: '1' })
      .andWhere('id = :id', { id: menuId })
      .execute();
    return tx.affected ?? 0;
  }

  public async checkUnique(sysMenu: SysMenu): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysMenu, 's')
      .andWhere("s.menu_del = '0'");
    if (sysMenu.parentId >= 0) {
      tx.andWhere('s.parent_id = :parentId', { parentId: sysMenu.parentId });
    }
    if (sysMenu.menuName) {
      tx.andWhere('s.menu_name = :menuName', { menuName: sysMenu.menuName });
    }
    if (sysMenu.menuPath) {
      tx.andWhere('s.menu_path = :menuPath', { menuPath: sysMenu.menuPath });
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async checkUniqueMenuPath(
    menuPath: string,
    menuId: number
  ): Promise<number> {
    if (!menuPath) {
      return 0;
    }
    const row = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysMenu, 's')
      .andWhere(
        "s.menu_del = '0' and s.menu_type in (:menuTypes) and s.menu_path = :menuPath",
        { menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU], menuPath }
      )
      .getRawOne();
    const id = Number(row?.id ?? 0);
    return id === menuId ? 0 : id;
  }

  public async existChildrenByMenuIdAndStatus(
    menuId: number,
    menuStatus: string
  ): Promise<number> {
    if (menuId <= 0) {
      return 0;
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .from(SysMenu, 's')
      .andWhere("s.parent_id = :menuId and s.menu_del = '0'", { menuId });
    if (menuStatus) {
      tx.andWhere(
        's.menu_status = :menuStatus and s.menu_type in (:menuTypes)',
        { menuStatus, menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU] }
      );
    }
    return await tx.getCount();
  }

  public async selectPermsByUserId(userId: number): Promise<string[]> {
    if (userId <= 0) {
      return [];
    }
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('m.menuPerms', 'menuPerms')
      .distinct(true)
      .from(SysMenu, 'm')
      .leftJoin('sys_role_menu', 'rm', 'rm.menu_id = m.id')
      .leftJoin('sys_user_role', 'ur', 'rm.role_id = ur.role_id')
      .leftJoin(
        'sys_role',
        'r',
        "r.id = ur.role_id and r.role_status = '1'"
      )
      .andWhere(
        "m.menu_status = '1' and m.menu_perms != '' and ur.user_id = :userId",
        { userId }
      )
      .getRawMany();
    return rows.map(row => String(row.menuPerms));
  }

  public async selectByRoleId(
    roleId: number,
    menuCheckStrictly: boolean
  ): Promise<number[]> {
    if (roleId <= 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .distinct(true)
      .from(SysMenu, 's')
      .andWhere("s.menu_del = '0'")
      .andWhere(
        's.id in (select menu_id from sys_role_menu where role_id = :roleId)',
        { roleId }
      );
    if (menuCheckStrictly) {
      tx.andWhere(
        `s.id not in (
          select m.parent_id from sys_menu m
          inner join sys_role_menu rm on m.id = rm.menu_id
          and rm.role_id = :roleId
        )`,
        { roleId }
      );
    }
    const rows = await tx.getRawMany();
    return rows.map(row => Number(row.id));
  }

  public async selectTreeByUserId(userId: number): Promise<SysMenu[]> {
    if (userId < 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere("s.menu_del = '0'");
    if (userId === 0) {
      tx.andWhere("s.menu_type in (:menuTypes) and s.menu_status = '1'", {
        menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU],
      });
    } else {
      tx.andWhere(
        `s.menu_type in (:menuTypes) and s.menu_status = '1'
        and s.id in (
        select menu_id from sys_role_menu where role_id in (
        select role_id from sys_user_role where user_id = :userId
        ))`,
        { menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU], userId }
      );
    }
    return await tx
      .addOrderBy('s.parent_id', 'ASC')
      .addOrderBy('s.menu_sort', 'ASC')
      .getMany();
  }
}
