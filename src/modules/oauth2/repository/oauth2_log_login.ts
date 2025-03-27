import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { Oauth2LogLogin } from '../model/oauth2_log_login';

/**用户授权第三方应用登录日志表 数据层处理 */
@Provide()
@Singleton()
export class Oauth2LogLoginRepository {
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
  ): Promise<[Oauth2LogLogin[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(Oauth2LogLogin, 's');
    // 查询条件拼接
    if (query.loginIp) {
      tx.andWhere('s.login_ip like :loginIp', {
        loginIp: query.loginIp + '%',
      });
    }
    if (query.clientId) {
      tx.andWhere('s.client_id = :clientId', {
        clientId: query.clientId + '%',
      });
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

    // 查询结果
    let total = 0;
    let rows: Oauth2LogLogin[] = [];

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
   * @param param 信息
   * @return ID
   */
  public async insert(param: Oauth2LogLogin): Promise<number> {
    param.loginTime = Date.now().valueOf();
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(Oauth2LogLogin)
      .values(param)
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
      .from(Oauth2LogLogin)
      .execute();
    return tx.affected;
  }
}
