import { Inject, Provide, Singleton } from '@midwayjs/core';
import { EntityManager, In, InsertResult, UpdateResult } from 'typeorm';
import { ResultSetHeader } from '../../../typings/commont';

import { DynamicDataSource } from '../../../internal/infra/database/db';
import { parseNumber } from '../../../internal/shared/parse/parse';
import { SysRole } from '../model/sys_role';

/** Role data access. */
@Provide()
@Singleton()
export class SysRoleRepository {
  @Inject()
  private db: DynamicDataSource;

  public async selectByPage(
    query: Record<string, string>
  ): Promise<[SysRole[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .andWhere('s.deleted_at = 0');
    if (query.role_name) {
      tx.andWhere('s.role_name like :role_name', {
        role_name: query.role_name + '%',
      });
    }
    if (query.role_key) {
      tx.andWhere('s.role_key like :role_key', {
        role_key: query.role_key + '%',
      });
    }
    if (query.role_status) {
      tx.andWhere('s.role_status = :role_status', {
        role_status: query.role_status,
      });
    }
    if (query.create_time_begin) {
      if (`${query.create_time_begin}`.length === 10) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(`${query.create_time_begin}000`),
        });
      } else if (`${query.create_time_begin}`.length === 13) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(query.create_time_begin),
        });
      }
    }
    if (query.create_time_end) {
      if (`${query.create_time_end}`.length === 10) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(`${query.create_time_end}999`),
        });
      } else if (`${query.create_time_end}`.length === 13) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(query.create_time_end),
        });
      }
    }
    const dept_id = query.dept_id;
    if (dept_id) {
      tx.andWhere(
        `s.id in (
          select distinct role_id from sys_role_dept
          where sys_role_dept.dept_id in (
            select descendant_id from sys_dept_closure where ancestor_id = :dept_id
          )
        )`,
        { dept_id }
      );
    }

    const total = await tx.getCount();
    if (total <= 0) {
      return [[], total];
    }

    const [pageNum, pageSize] = this.db.pageNumSize(
      query.page_num,
      query.page_size
    );
    tx.skip(pageSize * pageNum).take(pageSize);

    // 排序，格式: sort=create_time,id:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      create_time: 's.create_time',
      update_time: 's.update_time',
      role_name: 's.role_name',
      role_key: 's.role_key',
      role_sort: 's.role_sort',
      role_status: 's.role_status',
      role_data_scope: 's.role_data_scope',
    };
    const orders = this.db.sortParse(query.sort, columnMap);
    this.db.sortOrDefault(tx, orders, 's.role_sort ASC');

    const rows = await tx.getMany();
    return [rows, total];
  }

  public async select(sysRole: SysRole): Promise<SysRole[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .andWhere('s.deleted_at = 0');
    if (sysRole.role_key) {
      tx.andWhere('s.role_key like :role_key', {
        role_key: sysRole.role_key + '%',
      });
    }
    if (sysRole.role_name) {
      tx.andWhere('s.role_name like :role_name', {
        role_name: sysRole.role_name + '%',
      });
    }
    if (sysRole.role_status) {
      tx.andWhere('s.role_status = :role_status', {
        role_status: sysRole.role_status,
      });
    }
    return await tx.addOrderBy('s.role_sort', 'ASC').getMany();
  }

  public async selectByIds(role_ids: number[]): Promise<SysRole[]> {
    if (role_ids.length <= 0) {
      return [];
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .andWhere('s.id in (:role_ids) and s.deleted_at = 0', { role_ids })
      .getMany();
  }

  public async insert(
    sysRole: SysRole,
    entityManager?: EntityManager
  ): Promise<number> {
    delete (sysRole as Partial<SysRole>).deleted_at;
    delete (sysRole as Partial<SysRole>).deleted_by;
    if (sysRole.create_by) {
      const ms = Date.now();
      sysRole.update_by = sysRole.create_by;
      sysRole.update_time = ms;
      sysRole.create_time = ms;
    }
    if (entityManager) {
      const result: InsertResult = await entityManager.insert(SysRole, sysRole);
      const raw: ResultSetHeader = result.raw;
      return raw.insertId > 0 ? raw.insertId : 0;
    }
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysRole)
      .values(sysRole)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    return raw.insertId > 0 ? raw.insertId : 0;
  }

  public async update(
    sysRole: SysRole,
    entityManager?: EntityManager
  ): Promise<number> {
    if (sysRole.id <= 0) {
      return 0;
    }
    if (sysRole.update_by) {
      sysRole.update_time = Date.now();
    }
    const data = Object.assign({}, sysRole);
    delete (data as Partial<SysRole>).id;
    delete (data as Partial<SysRole>).deleted_at;
    delete (data as Partial<SysRole>).deleted_by;
    delete (data as Partial<SysRole>).create_by;
    delete (data as Partial<SysRole>).create_time;
    delete (data as Partial<SysRole>).dept_ids;
    delete (data as Partial<SysRole>).menu_ids;
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysRole,
        sysRole.id,
        data
      );
      return result.affected ?? 0;
    }
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysRole)
      .set(data)
      .andWhere('id = :id', { id: sysRole.id })
      .execute();
    return tx.affected ?? 0;
  }

  public async updateStatus(
    role_id: number,
    role_status: string,
    update_by: string
  ): Promise<number> {
    if (role_id <= 0) {
      return 0;
    }
    const result: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysRole)
      .set({
        role_status,
        update_by,
        update_time: Date.now(),
      })
      .andWhere('id = :role_id and deleted_at = 0', { role_id })
      .execute();
    return result.affected ?? 0;
  }

  public async deleteByIds(
    role_ids: number[],
    deletedBy: string,
    entityManager?: EntityManager
  ): Promise<number> {
    if (role_ids.length === 0) return 0;
    const now = Date.now();
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysRole,
        { id: In(role_ids) },
        { deleted_at: now, ...(deletedBy ? { deleted_by: deletedBy } : {}) }
      );
      return result.affected ?? 0;
    }
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .update(SysRole)
      .set({
        deleted_at: now,
        ...(deletedBy ? { deleted_by: deletedBy } : {}),
      })
      .andWhere('id in (:role_ids)', { role_ids })
      .execute();
    return tx.affected ?? 0;
  }

  public async checkUnique(sysRole: SysRole): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysRole, 's')
      .andWhere('s.deleted_at = 0');
    if (sysRole.role_name) {
      tx.andWhere('s.role_name = :role_name', { role_name: sysRole.role_name });
    }
    if (sysRole.role_key) {
      tx.andWhere('s.role_key = :role_key', { role_key: sysRole.role_key });
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async selectByUserId(user_id: number): Promise<SysRole[]> {
    if (user_id <= 0) {
      return [];
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .distinct(true)
      .select('r')
      .from(SysRole, 'r')
      .leftJoin('sys_user_role', 'ur', 'ur.role_id = r.id')
      .leftJoin('sys_user', 'u', 'u.id = ur.user_id')
      .andWhere(
        'u.deleted_at = 0 and r.deleted_at = 0 and ur.user_id = :user_id',
        {
          user_id,
        }
      )
      .getMany();
  }

  public async selectByUserIds(
    userIds: number[]
  ): Promise<Map<number, SysRole[]>> {
    const roleMap = new Map<number, SysRole[]>();
    if (userIds.length <= 0) {
      return roleMap;
    }
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('ur.user_id', 'user_id')
      .addSelect('r.id', 'id')
      .addSelect('r.role_name', 'role_name')
      .addSelect('r.role_key', 'role_key')
      .addSelect('r.role_sort', 'role_sort')
      .addSelect('r.role_data_scope', 'role_data_scope')
      .addSelect('r.role_menu_check_strictly', 'role_menu_check_strictly')
      .addSelect('r.role_dept_check_strictly', 'role_dept_check_strictly')
      .addSelect('r.role_status', 'role_status')
      .from(SysRole, 'r')
      .innerJoin('sys_user_role', 'ur', 'ur.role_id = r.id')
      .andWhere('r.deleted_at = 0 and ur.user_id in (:userIds)', {
        userIds,
      })
      .getRawMany();

    for (const row of rows) {
      const role = new SysRole();
      role.id = Number(row.id);
      role.role_name = row.role_name;
      role.role_key = row.role_key;
      role.role_sort = Number(row.role_sort);
      role.role_data_scope = row.role_data_scope;
      role.role_menu_check_strictly = row.role_menu_check_strictly;
      role.role_dept_check_strictly = row.role_dept_check_strictly;
      role.role_status = row.role_status;

      const user_id = Number(row.user_id);
      const existing = roleMap.get(user_id) || [];
      existing.push(role);
      roleMap.set(user_id, existing);
    }
    return roleMap;
  }
}
