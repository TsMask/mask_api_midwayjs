import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysLogOperate } from '../model/sys_log_operate';

/**操作日志表 数据层处理 */
@Provide()
@Singleton()
export class SysLogOperateRepository {
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
  ): Promise<[SysLogOperate[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysLogOperate, 's');
    // 查询条件拼接
    if (query.title) {
      tx.andWhere('s.title like :title', {
        title: query.title + '%',
      });
    }
    if (query.businessType) {
      tx.andWhere('s.business_type = :businessType', {
        businessType: query.businessType,
      });
    }
    if (query.operaBy) {
      tx.andWhere('s.opera_by like :operaBy', {
        operaBy: query.operaBy + '%',
      });
    }
    if (query.operaIp) {
      tx.andWhere('s.opera_ip like :operaIp', {
        operaIp: query.operaIp + '%',
      });
    }
    if (query.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: query.statusFlag,
      });
    }
    if (query.beginTime) {
      if (`${query.beginTime}`.length === 10) {
        tx.andWhere('s.opera_time >= :beginTime', {
          beginTime: parseNumber(`${query.beginTime}000`),
        });
      } else if (`${query.beginTime}`.length === 13) {
        tx.andWhere('s.opera_time >= :beginTime', {
          beginTime: parseNumber(query.beginTime),
        });
      }
    }
    if (query.endTime) {
      if (`${query.endTime}`.length === 10) {
        tx.andWhere('s.opera_time <= :endTime', {
          endTime: parseNumber(`${query.endTime}000`),
        });
      } else if (`${query.endTime}`.length === 13) {
        tx.andWhere('s.opera_time <= :endTime', {
          endTime: parseNumber(query.endTime),
        });
      }
    }
    if (dataScopeSQL) {
      dataScopeSQL = `select distinct user_name from sys_user where ${dataScopeSQL}`;
      tx.andWhere(`s.opera_by in ( ${dataScopeSQL} )`);
    }

    // 查询结果
    let total = 0;
    let rows: SysLogOperate[] = [];

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
        if (sortBy === 'operaBy') {
          sort = 's.opera_by';
        } else if (sortBy === 'operaTime') {
          sort = 's.opera_time';
        } else if (sortBy === 'costTime') {
          sort = 's.cost_time';
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
   * @param sysLogOperate 信息
   * @return ID
   */
  public async insert(sysLogOperate: SysLogOperate): Promise<number> {
    if (sysLogOperate.operaBy) {
      sysLogOperate.operaTime = Date.now().valueOf();
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysLogOperate)
      .values(sysLogOperate)
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
      .from(SysLogOperate)
      .execute();
    return tx.affected;
  }
}
