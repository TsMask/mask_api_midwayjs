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

  public async select(sysMenu: SysMenu, user_id: number): Promise<SysMenu[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's');
    if (sysMenu.menu_name) {
      tx.andWhere('s.menu_name like :menu_name', {
        menu_name: sysMenu.menu_name + '%',
      });
    }
    if (sysMenu.menu_visible) {
      tx.andWhere('s.menu_visible = :menu_visible', {
        menu_visible: sysMenu.menu_visible,
      });
    }
    if (sysMenu.menu_status) {
      tx.andWhere('s.menu_status = :menu_status', {
        menu_status: sysMenu.menu_status,
      });
    }
    if (user_id > 0) {
      tx.andWhere(
        `s.id in (
          select menu_id from sys_role_menu where role_id in (
          select role_id from sys_user_role where user_id = :user_id
          ))`,
        { user_id }
      );
    }
    return await tx
      .addOrderBy('s.parent_id', 'ASC')
      .addOrderBy('s.menu_sort', 'ASC')
      .getMany();
  }

  public async selectByIds(menu_ids: number[]): Promise<SysMenu[]> {
    if (menu_ids.length <= 0) {
      return [];
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
      .andWhere('s.id in (:menu_ids)', { menu_ids })
      .getMany();
  }

  public async insert(
    sysMenu: SysMenu,
    entityManager?: EntityManager
  ): Promise<number> {
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
    delete (data as Partial<SysMenu>).create_by;
    delete (data as Partial<SysMenu>).create_time;
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
    menu_id: number,
    entityManager?: EntityManager
  ): Promise<number> {
    if (menu_id <= 0) return 0;
    if (entityManager) {
      const result: DeleteResult = await entityManager.delete(SysMenu, menu_id);
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysMenu)
      .where('id = :id', { id: menu_id })
      .execute();
    return tx.affected ?? 0;
  }

  public async checkUnique(sysMenu: SysMenu): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysMenu, 's');
    if (sysMenu.parent_id >= 0) {
      tx.andWhere('s.parent_id = :parent_id', { parent_id: sysMenu.parent_id });
    }
    if (sysMenu.menu_name) {
      tx.andWhere('s.menu_name = :menu_name', { menu_name: sysMenu.menu_name });
    }
    if (sysMenu.menu_path) {
      tx.andWhere('s.menu_path = :menu_path', { menu_path: sysMenu.menu_path });
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async checkUniqueMenuPath(
    menu_path: string,
    menu_id: number
  ): Promise<number> {
    if (!menu_path) {
      return 0;
    }
    const row = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysMenu, 's')
      .andWhere(
        's.menu_type in (:menuTypes) and s.menu_path = :menu_path',
        { menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU], menu_path }
      )
      .getRawOne();
    const id = Number(row?.id ?? 0);
    return id === menu_id ? 0 : id;
  }

  public async existChildrenByMenuIdAndStatus(
    menu_id: number,
    menu_status: string
  ): Promise<number> {
    if (menu_id <= 0) {
      return 0;
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .from(SysMenu, 's')
      .andWhere('s.parent_id = :menu_id', { menu_id });
    if (menu_status) {
      tx.andWhere(
        's.menu_status = :menu_status and s.menu_type in (:menuTypes)',
        { menu_status, menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU] }
      );
    }
    return await tx.getCount();
  }

  public async selectPermsByUserId(user_id: number): Promise<string[]> {
    if (user_id <= 0) {
      return [];
    }
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('m.menu_perms', 'menu_perms')
      .distinct(true)
      .from(SysMenu, 'm')
      .leftJoin('sys_role_menu', 'rm', 'rm.menu_id = m.id')
      .leftJoin('sys_user_role', 'ur', 'rm.role_id = ur.role_id')
      .leftJoin('sys_role', 'r', "r.id = ur.role_id and r.role_status = '1'")
      .andWhere(
        "m.menu_status = '1' and m.menu_perms != '' and ur.user_id = :user_id",
        { user_id }
      )
      .getRawMany();
    return rows.map(row => String(row.menu_perms));
  }

  public async selectByRoleId(
    role_id: number,
    menuCheckStrictly: boolean
  ): Promise<number[]> {
    if (role_id <= 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .distinct(true)
      .from(SysMenu, 's')
      .andWhere(
        's.id in (select menu_id from sys_role_menu where role_id = :role_id)',
        { role_id }
      );
    if (menuCheckStrictly) {
      // 父子互相关联显示时只返回叶子节点，父级状态由前端树推导。
      tx.andWhere(
        `s.id not in (
          select m.parent_id from sys_menu m where m.parent_id <> 0
        )`
      );
    }
    const rows = await tx.getRawMany();
    return rows.map(row => Number(row.id));
  }

  public async selectTreeByUserId(user_id: number): Promise<SysMenu[]> {
    if (user_id < 0) {
      return [];
    }
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysMenu, 's')
    if (user_id === 0) {
      tx.andWhere("s.menu_type in (:menuTypes) and s.menu_status = '1'", {
        menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU],
      });
    } else {
      tx.andWhere(
        `s.menu_type in (:menuTypes) and s.menu_status = '1'
        and s.id in (
        select menu_id from sys_role_menu where role_id in (
        select role_id from sys_user_role where user_id = :user_id
        ))`,
        { menuTypes: [MENU_TYPE_DIR, MENU_TYPE_MENU], user_id }
      );
    }
    return await tx
      .addOrderBy('s.parent_id', 'ASC')
      .addOrderBy('s.menu_sort', 'ASC')
      .getMany();
  }
}
