import { Inject, Provide, Singleton } from '@midwayjs/core';
import { EntityManager, In, InsertResult, UpdateResult } from 'typeorm';

import {
  parseBoolean,
  parseNumber,
} from '../../../internal/shared/parse/parse';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysUser } from '../model/sys_user';
import { ResultSetHeader } from '../../../typings/commont';

/**用户排序字段映射 */
const sysUserSortMapping: Record<string, string> = {
  id: 's.id',
  create_time: 's.create_time',
  update_time: 's.update_time',
  user_name: 's.user_name',
  user_nick: 's.user_nick',
  user_phone: 's.user_phone',
  user_email: 's.user_email',
  user_status: 's.user_status',
  user_login_ip: 's.user_login_ip',
  user_login_time: 's.user_login_time',
  dept_id: 's.dept_id',
};

/** User data access. */
@Provide()
@Singleton()
export class SysUserRepository {
  @Inject()
  private db: DynamicDataSource;

  public async selectByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysUser[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere('s.deleted_at = 0');
    if (query.id) {
      tx.andWhere('s.id = :id', { id: query.id });
    }
    if (query.user_name) {
      tx.andWhere('s.user_name like :user_name', {
        user_name: query.user_name + '%',
      });
    }
    if (query.user_phone) {
      tx.andWhere('s.user_phone like :user_phone', {
        user_phone: query.user_phone + '%',
      });
    }
    if (query.user_status) {
      tx.andWhere('s.user_status = :user_status', {
        user_status: query.user_status,
      });
    }
    if (query.login_time_begin) {
      if (`${query.login_time_begin}`.length === 10) {
        tx.andWhere('s.user_login_time >= :beginTime', {
          beginTime: parseNumber(`${query.login_time_begin}000`),
        });
      } else if (`${query.login_time_begin}`.length === 13) {
        tx.andWhere('s.user_login_time >= :beginTime', {
          beginTime: parseNumber(query.login_time_begin),
        });
      }
    }
    if (query.login_time_end) {
      if (`${query.login_time_end}`.length === 10) {
        tx.andWhere('s.user_login_time <= :endTime', {
          endTime: parseNumber(`${query.login_time_end}999`),
        });
      } else if (`${query.login_time_end}`.length === 13) {
        tx.andWhere('s.user_login_time <= :endTime', {
          endTime: parseNumber(query.login_time_end),
        });
      }
    }
    if (query.dept_id) {
      tx.andWhere(
        `(s.dept_id = :dept_id or s.dept_id in (
          select descendant_id from sys_dept_closure where ancestor_id = :dept_id
        ))`,
        { dept_id: query.dept_id }
      );
    }
    if (filter?.sql) {
      tx.andWhere(filter.sql, filter.params);
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
    const orders = this.db.sortParse(query.sort, sysUserSortMapping);
    this.db.sortOrDefault(tx, orders, 's.id DESC');

    const rows = await tx.getMany();
    return [rows, total];
  }

  public async select(sysUser: SysUser): Promise<SysUser[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere('s.deleted_at = 0');
    if (sysUser.user_name) {
      tx.andWhere('s.user_name like :user_name', {
        user_name: sysUser.user_name + '%',
      });
    }
    if (sysUser.user_phone) {
      tx.andWhere('s.user_phone like :user_phone', {
        user_phone: sysUser.user_phone + '%',
      });
    }
    if (sysUser.user_status) {
      tx.andWhere('s.user_status = :user_status', {
        user_status: sysUser.user_status,
      });
    }
    if (sysUser.id) {
      tx.andWhere('s.id = :id', { id: sysUser.id });
    }
    return await tx.addOrderBy('s.id', 'DESC').getMany();
  }

  public async selectByIds(userIds: number[]): Promise<SysUser[]> {
    if (userIds.length <= 0) {
      return [];
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .addSelect('s.user_password')
      .from(SysUser, 's')
      .andWhere('s.id in (:userIds) and s.deleted_at = 0', { userIds })
      .getMany();
  }

  public async insert(
    sysUser: SysUser,
    entityManager?: EntityManager
  ): Promise<number> {
    delete (sysUser as Partial<SysUser>).deleted_at;
    delete (sysUser as Partial<SysUser>).deleted_by;
    if (sysUser.create_by) {
      const ms = Date.now();
      sysUser.update_by = sysUser.create_by;
      sysUser.update_time = ms;
      sysUser.create_time = ms;
    }
    if (entityManager) {
      const result: InsertResult = await entityManager.insert(SysUser, sysUser);
      const raw: ResultSetHeader = result.raw;
      return raw.insertId > 0 ? raw.insertId : 0;
    }
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysUser)
      .values(sysUser)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    return raw.insertId > 0 ? raw.insertId : 0;
  }

  public async update(
    sysUser: SysUser,
    entityManager?: EntityManager
  ): Promise<number> {
    if (sysUser.id <= 0) {
      return 0;
    }
    if (sysUser.update_by) {
      sysUser.update_time = Date.now();
    }
    if (!sysUser.user_password) {
      delete (sysUser as Partial<SysUser>).user_password;
    }
    const data = Object.assign({}, sysUser);
    delete (data as Partial<SysUser>).deleted_at;
    delete (data as Partial<SysUser>).deleted_by;
    delete (data as Partial<SysUser>).create_by;
    delete (data as Partial<SysUser>).create_time;
    delete (data as Partial<SysUser>).dept;
    delete (data as Partial<SysUser>).roles;
    delete (data as Partial<SysUser>).role_ids;
    delete (data as Partial<SysUser>).post_ids;
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysUser,
        sysUser.id,
        data
      );
      return result.affected ?? 0;
    }
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysUser)
      .set(data)
      .andWhere('id = :id', { id: sysUser.id })
      .execute();
    return tx.affected ?? 0;
  }

  public async deleteByIds(
    userIds: number[],
    deletedBy: string,
    entityManager?: EntityManager
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    const now = Date.now();
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysUser,
        { id: In(userIds) },
        { deleted_at: now, ...(deletedBy ? { deleted_by: deletedBy } : {}) }
      );
      return result.affected ?? 0;
    }
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .update(SysUser)
      .set({
        deleted_at: now,
        ...(deletedBy ? { deleted_by: deletedBy } : {}),
      })
      .andWhere('id in (:userIds)', { userIds })
      .execute();
    return tx.affected ?? 0;
  }

  public async checkUnique(sysUser: SysUser): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysUser, 's')
      .andWhere('s.deleted_at = 0');
    if (sysUser.user_name) {
      tx.andWhere('s.user_name = :user_name', { user_name: sysUser.user_name });
    }
    if (sysUser.user_phone) {
      tx.andWhere('s.user_phone = :user_phone', {
        user_phone: sysUser.user_phone,
      });
    }
    if (sysUser.user_email) {
      tx.andWhere('s.user_email = :user_email', {
        user_email: sysUser.user_email,
      });
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async selectByUserName(user_name: string): Promise<SysUser> {
    if (!user_name) {
      return new SysUser();
    }
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .addSelect('s.user_password')
      .from(SysUser, 's')
      .andWhere('s.user_name = :user_name and s.deleted_at = 0', {
        user_name,
      })
      .getOne();
    return item ?? new SysUser();
  }

  public async selectByPhone(phone: string): Promise<SysUser> {
    if (!phone) {
      return new SysUser();
    }
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .addSelect('s.user_password')
      .from(SysUser, 's')
      .andWhere('s.user_phone = :phone and s.deleted_at = 0', { phone })
      .getOne();
    return item ?? new SysUser();
  }

  public async selectAuthUsersByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysUser[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere('s.deleted_at = 0');
    if (query.user_name) {
      tx.andWhere('s.user_name like :user_name', {
        user_name: query.user_name + '%',
      });
    }
    if (query.user_phone) {
      tx.andWhere('s.user_phone like :user_phone', {
        user_phone: query.user_phone + '%',
      });
    }
    if (query.user_status) {
      tx.andWhere('s.user_status = :user_status', {
        user_status: query.user_status,
      });
    }
    if (query.role_id) {
      const auth = parseBoolean(query.auth);
      const action = auth ? 'in' : 'not in';
      tx.andWhere(
        `s.id ${action} (
          select distinct u.id from sys_user u
          inner join sys_user_role ur on u.id = ur.user_id
          and ur.role_id = :role_id
        )`,
        { role_id: query.role_id }
      );
    }
    if (filter?.sql) {
      tx.andWhere(filter.sql, filter.params);
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
    const orders = this.db.sortParse(query.sort, sysUserSortMapping);
    this.db.sortOrDefault(tx, orders, 's.id DESC');

    const rows = await tx.getMany();
    return [rows, total];
  }
}
