import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysLogLogin } from '../model/sys_log_login';

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
   * @param dataScopeSQL 角色数据范围过滤SQL字符串
   * @returns 集合
   */
  public async selectByPage(
    query: Record<string, string>,
    dataScopeSQL: string
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
    if (dataScopeSQL) {
      dataScopeSQL = `select distinct user_name from sys_user where ${dataScopeSQL}`;
      tx.andWhere(`s.user_name in ( ${dataScopeSQL} )`);
    }

    // 查询结果
    let total = 0;
    let rows: SysLogLogin[] = [];

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

    // 排序
    if (query.sortBy && query.sortOrder) {
      const sortByArr = query.sortBy.split(',');
      const sortOrderArr = query.sortOrder.split(',');
      for (let i = 0; i < sortByArr.length; i++) {
        const sortBy = sortByArr[i];
        const sortOrder = sortOrderArr[i];
        // 排序字段
        let sort = 's.id';
        if (sortBy === 'loginIp') {
          sort = 's.login_ip';
        } else if (sortBy === 'userName') {
          sort = 's.user_name';
        } else if (sortBy === 'createTime') {
          sort = 's.create_time';
        }
        // 排序方式
        let order: 'ASC' | 'DESC' = 'ASC';
        if (sortOrder.startsWith('asc')) {
          order = 'ASC';
        } else if (sortOrder.startsWith('desc')) {
          order = 'DESC';
        }
        tx.addOrderBy(sort, order);
      }
    } else {
      tx.addOrderBy('s.id', 'DESC');
    }
    // 查询数据
    rows = await tx.getMany();
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
    return tx.affected;
  }
}
