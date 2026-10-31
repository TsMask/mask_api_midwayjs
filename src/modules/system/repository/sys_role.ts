import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';
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
      .andWhere("s.role_del = '0'");
    if (query.role_name) {
      tx.andWhere('s.role_name like :roleName', {
        roleName: query.role_name + '%',
      });
    }
    if (query.role_key) {
      tx.andWhere('s.role_key like :roleKey', {
        roleKey: query.role_key + '%',
      });
    }
    if (query.role_status) {
      tx.andWhere('s.role_status = :roleStatus', {
        roleStatus: query.role_status,
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
    const deptId = query.dept_id ?? query.deptId;
    if (deptId) {
      tx.andWhere(
        `s.id in (
          select distinct role_id from sys_role_dept
          where sys_role_dept.dept_id in (
            select descendant_id from sys_dept_closure where ancestor_id = :deptId
          )
        )`,
        { deptId }
      );
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
      role_name: 's.role_name',
      role_key: 's.role_key',
      role_sort: 's.role_sort',
      role_status: 's.role_status',
      role_data_scope: 's.role_data_scope',
    };
    if (query.sort) {
      for (const item of query.sort.split(',')) {
        const [field, dir] = item.split(':');
        const column = columnMap[field];
        if (!column) continue;
        tx.addOrderBy(column, dir === 'asc' ? 'ASC' : 'DESC');
      }
    } else {
      tx.addOrderBy('s.role_sort', 'ASC');
    }
    return [await tx.getMany(), total];
  }

  public async select(sysRole: SysRole): Promise<SysRole[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .andWhere("s.role_del = '0'");
    if (sysRole.roleKey) {
      tx.andWhere('s.role_key like :roleKey', {
        roleKey: sysRole.roleKey + '%',
      });
    }
    if (sysRole.roleName) {
      tx.andWhere('s.role_name like :roleName', {
        roleName: sysRole.roleName + '%',
      });
    }
    if (sysRole.roleStatus) {
      tx.andWhere('s.role_status = :roleStatus', {
        roleStatus: sysRole.roleStatus,
      });
    }
    return await tx.addOrderBy('s.role_sort', 'ASC').getMany();
  }

  public async selectByIds(roleIds: number[]): Promise<SysRole[]> {
    if (roleIds.length <= 0) {
      return [];
    }
    return await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .andWhere("s.id in (:roleIds) and s.role_del = '0'", { roleIds })
      .getMany();
  }

  public async insert(sysRole: SysRole): Promise<number> {
    sysRole.roleDel = '0';
    if (sysRole.createBy) {
      const ms = Date.now().valueOf();
      sysRole.updateBy = sysRole.createBy;
      sysRole.updateTime = ms;
      sysRole.createTime = ms;
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

  public async update(sysRole: SysRole): Promise<number> {
    if (sysRole.id <= 0) {
      return 0;
    }
    if (sysRole.updateBy) {
      sysRole.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysRole);
    delete (data as Partial<SysRole>).id;
    delete (data as Partial<SysRole>).roleDel;
    delete (data as Partial<SysRole>).createBy;
    delete (data as Partial<SysRole>).createTime;
    delete (data as Partial<SysRole>).deptIds;
    delete (data as Partial<SysRole>).menuIds;
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysRole)
      .set(data)
      .andWhere('id = :id', { id: sysRole.id })
      .execute();
    return tx.affected ?? 0;
  }

  public async deleteByIds(roleIds: number[]): Promise<number> {
    if (roleIds.length === 0) return 0;
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysRole)
      .set({ roleDel: '1' })
      .andWhere('id in (:roleIds)', { roleIds })
      .execute();
    return tx.affected ?? 0;
  }

  public async checkUnique(sysRole: SysRole): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.id', 'id')
      .from(SysRole, 's')
      .andWhere("s.role_del = '0'");
    if (sysRole.roleName) {
      tx.andWhere('s.role_name = :roleName', { roleName: sysRole.roleName });
    }
    if (sysRole.roleKey) {
      tx.andWhere('s.role_key = :roleKey', { roleKey: sysRole.roleKey });
    }
    const row = await tx.getRawOne();
    return Number(row?.id ?? 0);
  }

  public async selectByUserId(userId: number): Promise<SysRole[]> {
    if (userId <= 0) {
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
        "u.user_del = '0' and r.role_del = '0' and ur.user_id = :userId",
        {
          userId,
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
      .select('ur.user_id', 'userId')
      .addSelect('r.id', 'id')
      .addSelect('r.role_name', 'roleName')
      .addSelect('r.role_key', 'roleKey')
      .addSelect('r.role_sort', 'roleSort')
      .addSelect('r.role_data_scope', 'roleDataScope')
      .addSelect('r.role_menu_check_strictly', 'roleMenuCheckStrictly')
      .addSelect('r.role_dept_check_strictly', 'roleDeptCheckStrictly')
      .addSelect('r.role_status', 'roleStatus')
      .addSelect('r.role_del', 'roleDel')
      .from(SysRole, 'r')
      .innerJoin('sys_user_role', 'ur', 'ur.role_id = r.id')
      .andWhere("r.role_del = '0' and ur.user_id in (:userIds)", { userIds })
      .getRawMany();

    for (const row of rows) {
      const role = new SysRole();
      role.id = Number(row.id);
      role.roleName = row.roleName;
      role.roleKey = row.roleKey;
      role.roleSort = Number(row.roleSort);
      role.roleDataScope = row.roleDataScope;
      role.roleMenuCheckStrictly = row.roleMenuCheckStrictly;
      role.roleDeptCheckStrictly = row.roleDeptCheckStrictly;
      role.roleStatus = row.roleStatus;
      role.roleDel = row.roleDel;

      const userId = Number(row.userId);
      const existing = roleMap.get(userId) || [];
      existing.push(role);
      roleMap.set(userId, existing);
    }
    return roleMap;
  }
}
