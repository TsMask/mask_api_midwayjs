import { Inject, Provide, Singleton } from '@midwayjs/core';
import {
  DeleteResult,
  EntityManager,
  In,
  InsertResult,
  UpdateResult,
} from 'typeorm';

import {
  parseBoolean,
  parseNumber,
} from '../../../internal/shared/parse/parse';
import { DynamicDataSource } from '../../../internal/infra/database/db';
import { SysUser } from '../model/sys_user';
import { passwordHash } from '../../../internal/shared/crypto/password';
import { ResultSetHeader } from '../../../typings/commont';

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
      .andWhere("s.user_del = '0'");
    if (query.id) {
      tx.andWhere('s.id = :id', { id: query.id });
    }
    if (query.user_name) {
      tx.andWhere('s.user_name like :userName', {
        userName: query.user_name + '%',
      });
    }
    if (query.user_phone) {
      tx.andWhere('s.user_phone like :userPhone', {
        userPhone: query.user_phone + '%',
      });
    }
    if (query.user_status) {
      tx.andWhere('s.user_status = :userStatus', {
        userStatus: query.user_status,
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
        `(s.dept_id = :deptId or s.dept_id in (
          select descendant_id from sys_dept_closure where ancestor_id = :deptId
        ))`,
        { deptId: query.dept_id }
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
      query.page_num ?? query.pageNum,
      query.page_size ?? query.pageSize
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    const columnMap: Record<string, string> = {
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
    if (query.sort) {
      for (const item of query.sort.split(',')) {
        const [field, dir] = item.split(':');
        const column = columnMap[field];
        if (!column) continue;
        tx.addOrderBy(column, dir === 'asc' ? 'ASC' : 'DESC');
      }
    } else {
      tx.addOrderBy('s.id', 'DESC');
    }
    return [await tx.getMany(), total];
  }

  public async select(sysUser: SysUser): Promise<SysUser[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.user_del = '0'");
    if (sysUser.userName) {
      tx.andWhere('s.user_name like :userName', {
        userName: sysUser.userName + '%',
      });
    }
    if (sysUser.userPhone) {
      tx.andWhere('s.user_phone like :userPhone', {
        userPhone: sysUser.userPhone + '%',
      });
    }
    if (sysUser.userStatus) {
      tx.andWhere('s.user_status = :userStatus', {
        userStatus: sysUser.userStatus,
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
      .addSelect('s.userPassword')
      .from(SysUser, 's')
      .andWhere("s.id in (:userIds) and s.user_del = '0'", { userIds })
      .getMany();
  }

  public async insert(
    sysUser: SysUser,
    entityManager?: EntityManager
  ): Promise<number> {
    sysUser.userDel = '0';
    if (sysUser.createBy) {
      const ms = Date.now().valueOf();
      sysUser.updateBy = sysUser.createBy;
      sysUser.updateTime = ms;
      sysUser.createTime = ms;
    }
    if (sysUser.userPassword) {
      sysUser.userPassword = await passwordHash(sysUser.userPassword);
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
    if (sysUser.updateBy) {
      sysUser.updateTime = Date.now().valueOf();
    }
    if (sysUser.userPassword) {
      sysUser.userPassword = await passwordHash(sysUser.userPassword);
    } else {
      delete (sysUser as Partial<SysUser>).userPassword;
    }
    const data = Object.assign({}, sysUser);
    delete (data as Partial<SysUser>).userDel;
    delete (data as Partial<SysUser>).createBy;
    delete (data as Partial<SysUser>).createTime;
    delete (data as Partial<SysUser>).dept;
    delete (data as Partial<SysUser>).roles;
    delete (data as Partial<SysUser>).roleIds;
    delete (data as Partial<SysUser>).postIds;
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
    entityManager?: EntityManager
  ): Promise<number> {
    if (userIds.length === 0) return 0;
    if (entityManager) {
      const result: UpdateResult = await entityManager.update(
        SysUser,
        { id: In(userIds) },
        { userDel: '1' }
      );
      return result.affected ?? 0;
    }
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysUser)
      .set({ userDel: '1' })
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
      .andWhere("s.user_del = '0'");
    if (sysUser.userName) {
      tx.andWhere('s.user_name = :userName', { userName: sysUser.userName });
    }
    if (sysUser.userPhone) {
      tx.andWhere('s.user_phone = :userPhone', {
        userPhone: sysUser.userPhone,
      });
    }
    if (sysUser.userEmail) {
      tx.andWhere('s.user_email = :userEmail', {
        userEmail: sysUser.userEmail,
      });
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async selectByUserName(userName: string): Promise<SysUser> {
    if (!userName) {
      return new SysUser();
    }
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .addSelect('s.userPassword')
      .from(SysUser, 's')
      .andWhere("s.user_name = :userName and s.user_del = '0'", { userName })
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
      .addSelect('s.userPassword')
      .from(SysUser, 's')
      .andWhere("s.user_phone = :phone and s.user_del = '0'", { phone })
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
      .andWhere("s.user_del = '0'");
    if (query.user_name) {
      tx.andWhere('s.user_name like :userName', {
        userName: query.user_name + '%',
      });
    }
    if (query.user_phone) {
      tx.andWhere('s.user_phone like :userPhone', {
        userPhone: query.user_phone + '%',
      });
    }
    if (query.user_status) {
      tx.andWhere('s.user_status = :userStatus', {
        userStatus: query.user_status,
      });
    }
    if (query.role_id) {
      const auth = parseBoolean(query.auth);
      const action = auth ? 'in' : 'not in';
      tx.andWhere(
        `s.id ${action} (
          select distinct u.id from sys_user u
          inner join sys_user_role ur on u.id = ur.user_id
          and ur.role_id = :roleId
        )`,
        { roleId: query.role_id }
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
      query.page_num ?? query.pageNum,
      query.page_size ?? query.pageSize
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    return [await tx.addOrderBy('s.id', 'DESC').getMany(), total];
  }
}
