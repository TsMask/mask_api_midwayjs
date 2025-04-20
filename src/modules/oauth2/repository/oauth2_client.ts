import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { Oauth2Client } from '../model/oauth2_client';

/**用户授权第三方应用表 数据层处理 */
@Provide()
@Singleton()
export class Oauth2ClientRepository {
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
  ): Promise<[Oauth2Client[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(Oauth2Client, 's')
      .andWhere("s.del_flag = '0'");
    // 查询条件拼接
    if (query.clientId) {
      tx.andWhere('s.client_id = :clientId', {
        clientId: query.clientId,
      });
    }
    if (query.title) {
      tx.andWhere('s.title like :title', {
        title: query.title + '%',
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
    let rows: Oauth2Client[] = [];

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
    rows = await tx.getMany();
    return [rows, total];
  }

  /**
   * 查询集合
   *
   * @param sysConfig 信息
   * @return 列表
   */
  public async select(param: Oauth2Client): Promise<Oauth2Client[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(Oauth2Client, 's')
      .andWhere("s.del_flag = '0'");
    // 构建查询条件
    if (param.clientId) {
      tx.andWhere('s.client_id = :clientId', {
        clientId: param.clientId,
      });
    }
    if (param.title) {
      tx.andWhere('s.title like :title', {
        title: param.title + '%',
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询信息
   *
   * @param ids ID数组
   * @return 信息
   */
  public async selectByIds(ids: number[]): Promise<Oauth2Client[]> {
    if (ids.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(Oauth2Client, 's')
      .andWhere("s.id in (:ids) and s.del_flag = '0'", {
        ids,
      })
      .getMany();
    if (rows.length > 0) {
      return rows;
    }
    return [];
  }

  /**
   * 新增信息 返回新增数据ID
   *
   * @param param 信息
   * @return ID
   */
  public async insert(param: Oauth2Client): Promise<number> {
    if (param.createBy) {
      const ms = Date.now().valueOf();
      param.updateBy = param.createBy;
      param.updateTime = ms;
      param.createTime = ms;
      param.delFlag = '0';
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(Oauth2Client)
      .values(param)
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
   * @param param 信息
   * @return 影响记录数
   */
  public async update(param: Oauth2Client): Promise<number> {
    if (param.id <= 0) {
      return 0;
    }
    if (param.updateBy) {
      param.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, param);
    delete data.id;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(Oauth2Client)
      .set(data)
      .andWhere('id = :id', { id: param.id })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除信息 返回受影响行数
   *
   * @param ids ID数组
   * @return 影响记录数
   */
  public async deleteByIds(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(Oauth2Client)
      .set({ delFlag: '1' })
      .andWhere('id in (:ids)', { ids })
      .execute();
    return tx.affected;
  }

  /**
   * 通过clientId查询
   * @param clientId 客户端ID
   * @returns
   */
  public async selectByClientId(clientId: string): Promise<Oauth2Client> {
    if (!clientId) {
      return new Oauth2Client();
    }

    // 查询数据
    const item = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(Oauth2Client, 's')
      .andWhere("s.client_id = :clientId and s.del_flag = '0'", { clientId })
      .getOne();
    if (!item) {
      return new Oauth2Client();
    }
    return item;
  }
}
