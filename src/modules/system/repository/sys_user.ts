import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import {
  parseBoolean,
  parseNumber,
} from '../../../framework/utils/parse/parse';
import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { SysUser } from '../model/sys_user';
import { bcryptHash } from '../../../framework/utils/crypto/bcrypt';

/**用户表 数据层处理 */
@Provide()
@Singleton()
export class SysUserRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 分页查询集合
   *
   * @param query 参数
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns 集合
   */
  public async selectByPage(
    query: Record<string, string>,
    dataScopeSQL: string
  ): Promise<[SysUser[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (query.userId) {
      tx.andWhere('s.user_id = :userId', { userId: query.userId });
    }
    if (query.userName) {
      tx.andWhere('s.user_name like :userName', {
        userName: query.userName + '%',
      });
    }
    if (query.phone) {
      tx.andWhere('s.phone like :phone', { phone: query.phone + '%' });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }
    if (query.beginTime) {
      if (`${query.beginTime}`.length === 10) {
        tx.andWhere('s.login_time >= :beginTime', {
          beginTime: parseNumber(`${query.beginTime}000`),
        });
      } else if (`${query.beginTime}`.length === 13) {
        tx.andWhere('s.login_time >= :beginTime', {
          beginTime: parseNumber(query.beginTime),
        });
      }
    }
    if (query.endTime) {
      if (`${query.endTime}`.length === 10) {
        tx.andWhere('s.login_time <= :endTime', {
          endTime: parseNumber(`${query.endTime}000`),
        });
      } else if (`${query.endTime}`.length === 13) {
        tx.andWhere('s.login_time <= :endTime', {
          endTime: parseNumber(query.endTime),
        });
      }
    }
    if (query.deptId) {
      tx.andWhere(
        `(s.dept_id = :deptId or s.dept_id in ( 
        select t.dept_id from sys_dept t where find_in_set(:deptId, ancestors) 
        ))`,
        { deptId: query.deptId }
      );
    }
    if (dataScopeSQL) {
      tx.andWhere(dataScopeSQL);
    }

    // 查询结果
    let total = 0;
    let rows: SysUser[] = [];

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
    rows = await tx.addOrderBy('s.user_id', 'DESC').getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysUser 信息
   * @return 列表
   */
  public async select(sysUser: SysUser): Promise<SysUser[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.del_flag = '0'");
    // 构建查询条件
    if (sysUser.userName) {
      tx.andWhere('s.user_name like :userName', {
        userName: sysUser.userName + '%',
      });
    }
    if (sysUser.phone) {
      tx.andWhere('s.phone like :phone', {
        phone: sysUser.phone + '%',
      });
    }
    if (sysUser.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysUser.statusFlag,
      });
    }
    if (sysUser.userId) {
      tx.andWhere('s.user_id = :userId', {
        userId: sysUser.userId,
      });
    }
    // 查询数据
    return await tx.addOrderBy('s.login_time', 'DESC').getMany();
  }

  /**
   * 通过ID查询
   *
   * @param userIds ID数组
   * @return 信息
   */
  public async selectByIds(userIds: number[]): Promise<SysUser[]> {
    if (userIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.user_id in (:userIds) and s.del_flag = '0'", { userIds })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增
   *
   * @param sysUser 信息
   * @return ID
   */
  public async insert(sysUser: SysUser): Promise<number> {
    sysUser.delFlag = '0';
    if (sysUser.createBy) {
      const ms = Date.now().valueOf();
      sysUser.updateBy = sysUser.createBy;
      sysUser.updateTime = ms;
      sysUser.createTime = ms;
    }
    if (sysUser.password) {
      const password = await bcryptHash(sysUser.password);
      sysUser.password = password;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysUser)
      .values(sysUser)
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
   * @param sysUser 信息
   * @return 影响记录数
   */
  public async update(sysUser: SysUser): Promise<number> {
    if (sysUser.userId <= 0) {
      return 0;
    }
    if (sysUser.updateBy) {
      sysUser.updateTime = Date.now().valueOf();
    }
    if (sysUser.password) {
      const password = await bcryptHash(sysUser.password);
      sysUser.password = password;
    } else {
      delete sysUser.password;
    }
    const data = Object.assign({}, sysUser);
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    delete data.dept;
    delete data.roles;
    delete data.roleId;
    delete data.roleIds;
    delete data.postIds;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysUser)
      .set(data)
      .andWhere('user_id = :userId', { userId: sysUser.userId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param userIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(userIds: number[]): Promise<number> {
    if (userIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysUser)
      .set({ delFlag: '1' })
      .andWhere('user_id in (:userIds)', { userIds })
      .execute();
    return tx.affected;
  }

  /**
   * 检查信息是否唯一 返回数据ID
   * @param sysUser 信息
   * @returns
   */
  public async checkUnique(sysUser: SysUser): Promise<number> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (sysUser.userName) {
      tx.andWhere('s.user_name = :userName', {
        userName: sysUser.userName,
      });
    }
    if (sysUser.phone) {
      tx.andWhere('s.phone = :phone', {
        phone: sysUser.phone,
      });
    }
    if (sysUser.email) {
      tx.andWhere('s.email = :email', {
        email: sysUser.email,
      });
    }
    // 查询数据
    const item = await tx.getOne();
    if (!item) {
      return 0;
    }
    return item.userId;
  }

  /**
   * 通过登录账号查询信息
   * @param userName 用户账号
   * @returns
   */
  public async selectByUserName(userName: string): Promise<SysUser> {
    if (!userName) {
      return new SysUser();
    }

    // 查询数据
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.user_name = :userName and s.del_flag = '0'", { userName })
      .getOne();
    if (!item) {
      return new SysUser();
    }
    return item;
  }

  /**
   * 分页查询集合By分配用户角色
   *
   * @param query 参数
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns 集合
   */
  public async selectAuthUsersByPage(
    query: Record<string, string>,
    dataScopeSQL: string
  ): Promise<[SysUser[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysUser, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (query.userName) {
      tx.andWhere('s.user_name like :userName', {
        userName: query.userName + '%',
      });
    }
    if (query.phone) {
      tx.andWhere('s.phone like :phone', {
        phone: query.phone + '%',
      });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }
    // 分配角色的用户
    if (query.roleId) {
      const auth = parseBoolean(query.auth);
      if (auth) {
        tx.andWhere(
          `s.user_id in (
            select distinct u.user_id from sys_user u 
            inner join sys_user_role ur on u.user_id = ur.user_id 
            and ur.role_id = :roleId
          )`,
          { roleId: query.roleId }
        );
      } else {
        tx.andWhere(
          `s.user_id not in (
            select distinct u.user_id from sys_user u 
            inner join sys_user_role ur on u.user_id = ur.user_id 
            and ur.role_id = :roleId
          )`,
          { roleId: query.roleId }
        );
      }
    }
    if (dataScopeSQL) {
      tx.andWhere(dataScopeSQL);
    }

    // 查询结果
    let total = 0;
    let rows: SysUser[] = [];

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
    rows = await tx.addOrderBy('s.user_id', 'DESC').getMany();
    return [rows, total];
  }
}
