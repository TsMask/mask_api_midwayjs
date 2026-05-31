import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysLogLogin } from '../model/sys_log_login';
import { ResultSetHeader } from '../../../typings/commont';

/**系统登录访问表 数据层处理 */
@Provide()
@Singleton()
export class SysLogLoginRepository {
  @Inject()
  private db: DynamicDataSource;

  /**
   * 分页查询集合
   *
   * @param query 参数
   * @param filter 角色数据范围过滤对象
   * @returns 集合
   */
  public async selectByPage(
    query: Record<string, string>,
    filter: { sql: string; params: Record<string, any> }
  ): Promise<[SysLogLogin[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysLogLogin, 's');
    // 查询条件拼接
    if (query.loginIp) {
      tx.andWhere('s.login_ip like :loginIp', {
        loginIp: query.loginIp + '%',
      });
    }
    if (query.userName) {
      tx.andWhere('s.user_name like :userName', {
        userName: query.userName + '%',
      });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }
    if (query.beginTime) {
      if (`${query.beginTime}`.length === 10) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(`${query.beginTime}000`),
        });
      } else if (`${query.beginTime}`.length === 13) {
        tx.andWhere('s.create_time >= :beginTime', {
          beginTime: parseNumber(query.beginTime),
        });
      }
    }
    if (query.endTime) {
      if (`${query.endTime}`.length === 10) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(`${query.endTime}000`),
        });
      } else if (`${query.endTime}`.length === 13) {
        tx.andWhere('s.create_time <= :endTime', {
          endTime: parseNumber(query.endTime),
        });
      }
    }
    if (filter?.sql) {
      tx.andWhere(
        `s.user_name in (select distinct user_name from sys_user where ${filter.sql})`,
        filter.params
      );
    }

    // 查询数量为0直接返回
    const total = await tx.getCount();
    if (total <= 0) {
      return [[], total];
    }

    // 查询数据分页
    const [pageNum, pageSize] = this.db.pageNumSize(
      query.pageNum,
      query.pageSize
    );
    tx.skip(pageSize * pageNum).take(pageSize);

    // 排序，格式: sort=createTime,loginIp:asc（不加方向默认 DESC）
    const columnMap: Record<string, string> = {
      id: 's.id',
      loginIp: 's.login_ip',
      userName: 's.user_name',
      loginLocation: 's.login_location',
      browser: 's.browser',
      os: 's.os',
      statusFlag: 's.status_flag',
      msg: 's.msg',
      loginTime: 's.login_time',
    };
    if (query.sort) {
      const items = query.sort.split(',');
      for (const item of items) {
        const [field, dir] = item.split(':');
        const column = columnMap[field];
        if (!column) continue;
        const order: 'ASC' | 'DESC' = dir === 'asc' ? 'ASC' : 'DESC';
        tx.addOrderBy(column, order);
      }
    } else {
      tx.addOrderBy('s.id', 'DESC');
    }

    const rows = await tx.getMany();
    return [rows, total];
  }

  /**
   * 新增
   *
   * @param sysLogLogin 信息
   * @return ID
   */
  public async insert(sysLogLogin: SysLogLogin): Promise<number> {
    sysLogLogin.loginTime = Date.now().valueOf();
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysLogLogin)
      .values(sysLogLogin)
      .execute();
    const raw: ResultSetHeader = tx.raw;
    if (raw.insertId > 0) {
      return raw.insertId;
    }
    return 0;
  }

  /**
   * 清空信息
   *
   * @return 影响记录数
   */
  public async clean(): Promise<number> {
    // 执行删除
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .delete()
      .from(SysLogLogin)
      .execute();
    return tx.affected ?? 0;
  }
}
