import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysRole } from '../model/sys_role';

/**角色表 数据层处理 */
@Provide()
@Singleton()
export class SysRoleRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 分页查询集合
   *
   * @param query 参数
   * @returns 集合
   */
  public async selectByPage(
    query: Record<string, string>
  ): Promise<[SysRole[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .where("s.del_flag = '0'");
    // 查询条件拼接
    if (query.roleName) {
      tx.where("s.role_name like concat(:roleName, '%')", {
        roleName: query.roleName,
      });
    }
    if (query.roleKey) {
      tx.where("s.role_key like concat(:roleKey, '%')", {
        roleKey: query.roleKey,
      });
    }
    if (query.statusFlag) {
      tx.where('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }
    if (query.beginTime) {
      if (`${query.beginTime}`.length === 10) {
        tx.where('s.create_time >= :beginTime', {
          beginTime: parseNumber(`${query.beginTime}000`),
        });
      } else if (`${query.beginTime}`.length === 13) {
        tx.where('s.create_time >= :beginTime', {
          beginTime: parseNumber(query.beginTime),
        });
      }
    }
    if (query.endTime) {
      if (`${query.endTime}`.length === 10) {
        tx.where('s.create_time <= :endTime', {
          endTime: parseNumber(`${query.endTime}000`),
        });
      } else if (`${query.endTime}`.length === 13) {
        tx.where('s.create_time <= :endTime', {
          endTime: parseNumber(query.endTime),
        });
      }
    }
    if (query.deptId) {
      tx.where(
        `s.role_id in ( 
        select distinct role_id from sys_role_dept where sys_role_dept.dept_id IN ( 
        SELECT dept_id FROM sys_dept WHERE dept_id = :deptId or find_in_set(:deptId , ancestors ) 
        ))`,
        { deptId: query.deptId }
      );
    }

    // 查询结果
    let total: number = 0;
    let rows: SysRole[] = [];

    // 查询数量为0直接返回
    total = await tx.getCount();
    if (total <= 0) {
      return [rows, total];
    }

    // 查询数据分页
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    tx.skip(pageSize * pageNum).take(pageSize);
    rows = await tx.orderBy('s.role_sort', 'ASC').getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysRole 信息
   * @return 列表
   */
  public async select(sysRole: SysRole): Promise<SysRole[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .where("s.del_flag = '0'");
    // 构建查询条件
    if (sysRole.roleKey) {
      tx.where("s.role_key like concat(:roleKey, '%')", {
        roleKey: sysRole.roleKey,
      });
    }
    if (sysRole.roleName) {
      tx.where("s.role_name like concat(:roleName, '%')", {
        roleName: sysRole.roleName,
      });
    }
    if (sysRole.statusFlag) {
      tx.where('s.status_flag = :statusFlag', {
        statusFlag: sysRole.statusFlag,
      });
    }
    // 查询数据
    return await tx.orderBy('s.role_sort', 'ASC').getMany();
  }

  /**
   * 通过ID查询
   *
   * @param roleIds ID数组
   * @return 信息
   */
  public async selectByIds(roleIds: number[]): Promise<SysRole[]> {
    if (roleIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysRole, 's')
      .where("s.role_id in (:roleIds) and s.del_flag = '0'", { roleIds })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysConfig 信息
   * @return ID
   */
  public async insert(sysRole: SysRole): Promise<number> {
    sysRole.delFlag = '0';
    if (sysRole.createBy) {
      const ms = Date.now().valueOf();
      sysRole.updateBy = sysRole.createBy;
      sysRole.updateTime = ms;
      sysRole.createTime = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysRole)
      .values(sysRole)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.insertId > 0) {
      return raw.insertId;
    }
    return 0;
  }

  /**
   * 更新
   *
   * @param sysRole 信息
   * @return 影响记录数
   */
  public async update(sysRole: SysRole): Promise<number> {
    if (sysRole.roleId <= 0) {
      return 0;
    }
    if (sysRole.updateBy) {
      sysRole.updateTime = Date.now().valueOf();
    }
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysRole)
      .set(sysRole)
      .where('role_id = :roleId', { roleId: sysRole.roleId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param roleIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(roleIds: number[]): Promise<number> {
    if (roleIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysRole)
      .set({ delFlag: '1' })
      .where('role_id in (:roleIds)', { roleIds })
      .execute();
    return tx.affected;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysRole 信息
   * @returns
   */
  public async checkUnique(sysRole: SysRole): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s.role_id')
      .from(SysRole, 's')
      .where("s.del_flag = '0'");
    // 查询条件拼接
    if (sysRole.roleName) {
      tx.where('s.role_name = :roleName', {
        roleName: sysRole.roleName,
      });
    }
    if (sysRole.roleKey) {
      tx.where('s.role_key = :roleKey', {
        roleKey: sysRole.roleKey,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.roleId;
  }

  /**
   * 根据用户ID获取角色信息
   * @param userId 用户ID
   * @returns 角色数组
   */
  public async selectByUserId(userId: number): Promise<SysRole[]> {
    if (userId <= 0) {
      return [];
    }
    const sqlStr = `select 
    distinct r.role_id, r.role_name, r.role_key, r.role_sort, r.data_scope, r.menu_check_strictly, r.dept_check_strictly, r.status_flag, r.del_flag, r.create_time, r.remark 
    from sys_user_role ur 
    left join sys_user u on u.user_id = ur.user_id 
    left join sys_role r on r.role_id = ur.role_id 
    where u.del_flag = '0' AND ur.user_id = ?`;

    const rows = await this.db.execute(sqlStr, [userId]);
    return rows;
  }
}
