import { Inject, Provide, Singleton } from '@midwayjs/core';
import { DeleteResult, InsertResult, UpdateResult } from 'typeorm';

import { DynamicDataSource } from '../../../framework/datasource/db/db';
import { parseNumber } from '../../../framework/utils/parse/parse';
import { SysNotice } from '../model/sys_notice';

/**通知公告表 数据层处理 */
@Provide()
@Singleton()
export class SysNoticeRepository {
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
  ): Promise<[SysNotice[], number]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysNotice, 's')
      .andWhere("del_flag = '0'");
    // 查询条件拼接
    if (query.noticeTitle) {
      tx.andWhere('s.notice_title like :noticeTitle', {
        noticeTitle: query.noticeTitle + '%',
      });
    }
    if (query.noticeType) {
      tx.andWhere('s.notice_type = :noticeType', {
        noticeType: query.noticeType,
      });
    }
    if (query.createBy) {
      tx.andWhere('s.create_by like :createBy', {
        createBy: query.createBy + '%',
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

    // 查询结果
    let total = 0;
    let rows: SysNotice[] = [];

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
   * @param sysNotice 信息
   * @return 列表
   */
  public async select(sysNotice: SysNotice): Promise<SysNotice[]> {
    const tx = this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysNotice, 's');
    // 构建查询条件
    if (sysNotice.noticeTitle) {
      tx.andWhere('s.notice_title like :noticeTitle', {
        noticeTitle: sysNotice.noticeTitle + '%',
      });
    }
    if (sysNotice.noticeType) {
      tx.andWhere('s.notice_type = :noticeType', {
        noticeType: sysNotice.noticeType,
      });
    }
    if (sysNotice.createBy) {
      tx.andWhere('s.create_by like :createBy', {
        createBy: sysNotice.createBy + '%',
      });
    }
    if (sysNotice.statusFlag) {
      tx.andWhere('s.status_flag = :statusFlag', {
        statusFlag: sysNotice.statusFlag,
      });
    }
    // 查询数据
    return await tx.getMany();
  }

  /**
   * 通过ID查询
   *
   * @param noticeIds ID数组
   * @return 信息
   */
  public async selectByIds(noticeIds: number[]): Promise<SysNotice[]> {
    if (noticeIds.length <= 0) {
      return [];
    }
    // 查询数据
    const rows = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .select('s')
      .from(SysNotice, 's')
      .andWhere("s.notice_id in (:noticeIds) and s.del_flag = '0'", {
        noticeIds,
      })
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
  public async insert(sysNotice: SysNotice): Promise<number> {
    sysNotice.delFlag = '0';
    if (sysNotice.createBy) {
      const ms = Date.now().valueOf();
      sysNotice.updateBy = sysNotice.createBy;
      sysNotice.updateTime = ms;
      sysNotice.createTime = ms;
    }
    // 执行插入
    const tx: InsertResult = await this.db
      .queryBuilder('')
      .insert()
      .into(SysNotice)
      .values(sysNotice)
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
   * @param sysNotice 信息
   * @return 影响记录数
   */
  public async update(sysNotice: SysNotice): Promise<number> {
    if (sysNotice.noticeId <= 0) {
      return 0;
    }
    if (sysNotice.updateBy) {
      sysNotice.updateTime = Date.now().valueOf();
    }
    const data = Object.assign({}, sysNotice);
    delete data.noticeId;
    delete data.delFlag;
    delete data.createBy;
    delete data.createTime;
    // 执行更新
    const tx: UpdateResult = await this.db
      .queryBuilder('')
      .createQueryBuilder()
      .update(SysNotice)
      .set(data)
      .andWhere('notice_id = :noticeId', { noticeId: sysNotice.noticeId })
      .execute();
    return tx.affected;
  }

  /**
   * 批量删除
   *
   * @param configIds ID数组
   * @return 影响记录数
   */
  public async deleteByIds(noticeIds: number[]): Promise<number> {
    if (noticeIds.length === 0) return 0;
    // 执行更新删除标记
    const tx: DeleteResult = await this.db
      .queryBuilder('')
      .update(SysNotice)
      .set({ delFlag: '1' })
      .andWhere('notice_id in (:noticeIds)', { noticeIds })
      .execute();
    return tx.affected;
  }
}
